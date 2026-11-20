// Checks every link in data/benchmarks.json (each record's links and evidence) and writes what each one answered to
// data/audits/link-health.json, which the data audit on each benchmark page reads (src/lib/bench-audit.ts).
//
// Each link gets a HEAD request, then a GET when the HEAD fails, since many servers answer HEAD badly. At most 8
// requests run at once, and never two to the same host, with a short pause between requests to one host. arXiv
// papers go through arXiv's export API in batches of 100, as scripts/abstracts.ts reads them, instead of one page
// request each. x.com and twitter.com are never fetched.
//
// What a result means: ok is true when the page answers (after redirects), false when it is gone (404, 410, no
// such host) or errs (5xx, a timeout, a bad certificate), and null when we can't tell: a 401, 403 or 429 is
// usually bot protection or a login, not a broken link.
//
// usage: node scripts/link-check.ts [--stale=DAYS] [--host=arxiv.org,github.com] [--dry]
//   --stale=DAYS  only check links whose last check is older than DAYS days (default: check every link)
//   --host=...    only check links on these hosts
//   --failed      only check links whose last check didn't get a good answer
//   --oldest=N    only check the N links checked longest ago (never-checked links first). The daily sync uses it to
//                 recheck the catalog a slice at a time, so the file changes a little each day, not all at once.
//   --dry         print what would be checked and stop
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { dataPath, readJson, today } from './lib/util.ts';

const UA = 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)';
const TIMEOUT = 15_000;
const AT_ONCE = 8;
const OUT = dataPath('audits', 'link-health.json');

interface Result {
  status: number;
  ok: boolean | null;
  final?: string;
  note?: string;
  at?: string;
}

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const stale = Number(arg('stale') ?? 0);
const onlyHosts = arg('host')?.split(',').filter(Boolean);
const dry = process.argv.includes('--dry');
const failedOnly = process.argv.includes('--failed');
const oldest = Number(arg('oldest') ?? 0);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
};
const SKIP = (h: string) => /(^|\.)(x\.com|twitter\.com)$/.test(h);
// the pause between two requests to one host: arXiv asks for three seconds, GitHub limits bursts
const gapFor = (h: string) => (h === 'arxiv.org' || h === 'export.arxiv.org' ? 3100 : h === 'github.com' ? 1000 : 500);

// ---- what to check --------------------------------------------------------------------------------
const benchmarks = readJson<{ id: string; links?: Record<string, string>; evidence?: string[] }[]>(dataPath('benchmarks.json'));
const urls = [...new Set(benchmarks.flatMap((b) => [...Object.values(b.links ?? {}), ...(b.evidence ?? [])]).filter((u) => typeof u === 'string' && u))].sort();
const old: Record<string, Result> = existsSync(OUT) ? (readJson<{ results?: Record<string, Result> }>(OUT).results ?? {}) : {};
const day = today();
const fresh = (u: string) => stale > 0 && old[u]?.at && (Date.parse(day) - Date.parse(old[u].at!)) / 86_400_000 < stale;
const results: Record<string, Result> = {};
// keep results for links still in the catalog, so a partial run doesn't forget the rest
for (const u of urls) if (old[u]) results[u] = old[u];

let todo = urls.filter((u) => !fresh(u) && (!onlyHosts || onlyHosts.includes(hostOf(u))) && (!failedOnly || (!!old[u] && old[u].ok !== true)));
// the sort is stable, so links checked on the same day keep their alphabetical order
if (oldest > 0) todo = todo.sort((a, b) => (old[a]?.at ?? '').localeCompare(old[b]?.at ?? '')).slice(0, oldest);
const byHost = new Map<string, string[]>();
for (const u of todo) {
  const h = hostOf(u);
  if (!h) {
    results[u] = { status: 0, ok: false, note: 'not a valid web address', at: day };
    continue;
  }
  if (SKIP(h)) {
    results[u] = { status: 0, ok: null, note: 'not checked: we never fetch x.com or twitter.com', at: day };
    continue;
  }
  byHost.set(h, [...(byHost.get(h) ?? []), u]);
}
console.log(`${urls.length} links in the catalog, ${todo.length} to check on ${byHost.size} hosts.`);
if (dry) {
  for (const [h, us] of [...byHost].sort((a, b) => b[1].length - a[1].length).slice(0, 20)) console.log(`  ${h}: ${us.length}`);
  process.exit(0);
}

// ---- one request ----------------------------------------------------------------------------------
async function request(url: string, method: 'HEAD' | 'GET'): Promise<{ status: number; final: string; blocked: boolean } | { error: string; gone: boolean; unsure?: boolean }> {
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8' },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    // a GET only needs the status: drop the body unread
    await res.body?.cancel().catch(() => {});
    const blocked = !!res.headers.get('cf-mitigated') || (res.status === 503 && /cloudflare/i.test(res.headers.get('server') ?? '') && !!res.headers.get('cf-ray'));
    return { status: res.status, final: res.url, blocked };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string; message?: string } };
    const code = err.cause?.code ?? '';
    if (err.name === 'TimeoutError' || err.name === 'AbortError') return { error: `timed out after ${TIMEOUT / 1000} s`, gone: false };
    if (code === 'ENOTFOUND') return { error: 'no such host', gone: true };
    // a server that leaves out an intermediate certificate: browsers fetch it themselves, so the page likely works
    if (/UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT/i.test(code)) return { error: 'incomplete certificate chain', gone: false, unsure: true };
    if (/CERT|SSL|TLS|SIGNATURE/i.test(code)) return { error: `certificate error, ${code}`, gone: false };
    return { error: (code || err.cause?.message || err.message || 'request failed').slice(0, 80), gone: false };
  }
}

const BLOCKED: Record<number, string> = { 401: 'needs a login', 403: 'blocks automated checks', 429: 'rate limited', 451: 'unavailable here', 999: 'blocks automated checks' };

async function probe(url: string): Promise<Result> {
  let r = await request(url, 'HEAD');
  // many servers answer HEAD badly (403, 404, 405, 501), so anything but a good answer or a rate limit gets a GET
  if ('error' in r || r.status >= 400) {
    if (!('status' in r && r.status === 429)) {
      const g = await request(url, 'GET');
      if (!('error' in g) || 'error' in r) r = g;
    }
  }
  // two more tries, after longer pauses, for a rate limit, a server error or a dropped connection, which are often
  // gone a minute later
  for (const wait of [8000, 25000]) {
    if (!(('status' in r && (r.status === 429 || r.status >= 500)) || ('error' in r && !r.gone))) break;
    await sleep(wait);
    const again = await request(url, 'GET');
    if ('status' in again && again.status < 400) r = again;
  }
  if ('error' in r) return { status: 0, ok: r.unsure ? null : false, note: r.error, at: day };
  const final = r.final && r.final !== url ? { final: r.final } : {};
  if (r.status < 400) return { status: r.status, ok: true, ...final, at: day };
  if (r.blocked) return { status: r.status, ok: null, ...final, note: 'bot protection', at: day };
  if (r.status === 404 || r.status === 410) return { status: r.status, ok: false, ...final, note: r.status === 404 ? 'not found' : 'gone', at: day };
  if (BLOCKED[r.status]) return { status: r.status, ok: null, ...final, note: BLOCKED[r.status], at: day };
  if (r.status >= 500) return { status: r.status, ok: false, ...final, note: 'server error', at: day };
  // another 4xx: often a server that dislikes automated requests, so it counts as unknown
  return { status: r.status, ok: null, ...final, note: `answered ${r.status}`, at: day };
}

// ---- arXiv, in batches ----------------------------------------------------------------------------
const arxivId = (u: string) => u.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?(?:\.pdf)?\/?$/i)?.[1];

async function arxivBatch(list: string[]): Promise<string[]> {
  // the papers the API knows: those links pass. The rest, and any batch that fails, fall back to a page request.
  const ids = new Map<string, string[]>();
  for (const u of list) {
    const id = arxivId(u)!;
    ids.set(id, [...(ids.get(id) ?? []), u]);
  }
  const all = [...ids.keys()];
  const left: string[] = [];
  for (let i = 0; i < all.length; i += 100) {
    const batch = all.slice(i, i + 100);
    let body = '';
    try {
      const res = await fetch(`https://export.arxiv.org/api/query?id_list=${batch.join(',')}&max_results=${batch.length}`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60_000) });
      body = res.ok ? await res.text() : '';
    } catch {
      body = '';
    }
    const found = new Set([...body.matchAll(/<id>https?:\/\/arxiv\.org\/abs\/(.+?)(?:v\d+)?<\/id>/g)].map((m) => m[1]));
    for (const id of batch)
      for (const u of ids.get(id)!) {
        if (found.has(id)) results[u] = { status: 200, ok: true, note: 'found through the arXiv API', at: day };
        else left.push(u);
      }
    tick(batch.length);
    await sleep(gapFor('export.arxiv.org'));
  }
  return left;
}

// ---- the run --------------------------------------------------------------------------------------
let done = 0;
let sinceSave = 0;
const started = Date.now();
function tick(n = 1) {
  done += n;
  sinceSave += n;
  if (sinceSave >= 250) {
    sinceSave = 0;
    save();
    console.log(`  ${done} of ${todo.length} checked, ${Math.round((Date.now() - started) / 1000)} s`);
  }
}

function save() {
  const keys = Object.keys(results).sort();
  const lines = keys.map((u) => `    ${JSON.stringify(u)}: ${JSON.stringify(results[u])}`);
  const text = `{\n  "note": "What each link in data/benchmarks.json answered, from scripts/link-check.ts. ok is true when the page answers, false when it is gone or errs, and null when the site blocks automated checks or we skip it. final is where redirects end, when that differs. at is the day of the check.",\n  "checked": ${JSON.stringify(day)},\n  "results": {\n${lines.join(',\n')}\n  }\n}\n`;
  mkdirSync(dirname(OUT), { recursive: true });
  // write beside the file, then move it into place, so a reader never sees half a file
  writeFileSync(`${OUT}.tmp`, text);
  renameSync(`${OUT}.tmp`, OUT);
}

// arXiv first, as one task: the API, then single requests for what it didn't find and for /html/ pages
const tasks: (() => Promise<void>)[] = [];
const arxiv = byHost.get('arxiv.org') ?? [];
if (arxiv.length) {
  byHost.delete('arxiv.org');
  tasks.push(async () => {
    const viaApi = arxiv.filter((u) => arxivId(u));
    const rest = [...(await arxivBatch(viaApi)), ...arxiv.filter((u) => !arxivId(u))];
    for (const u of rest) {
      results[u] = await probe(u);
      tick();
      await sleep(gapFor('arxiv.org'));
    }
  });
}
// the busiest hosts first, so the longest queues start early
for (const [h, list] of [...byHost].sort((a, b) => b[1].length - a[1].length))
  tasks.push(async () => {
    for (const u of list) {
      results[u] = await probe(u);
      tick();
      await sleep(gapFor(h));
    }
  });

let next = 0;
await Promise.all(
  Array.from({ length: AT_ONCE }, async () => {
    while (next < tasks.length) await tasks[next++]();
  }),
);

// a second pass a minute later for dropped connections and server errors, which are often gone by then
const shaky = todo.filter((u) => results[u]?.ok === false && (results[u].status >= 500 || (results[u].status === 0 && results[u].note !== 'no such host')));
if (shaky.length) {
  console.log(`  checking ${shaky.length} that failed again in a minute`);
  await sleep(60_000);
  const again = new Map<string, string[]>();
  for (const u of shaky) again.set(hostOf(u), [...(again.get(hostOf(u)) ?? []), u]);
  const hosts = [...again.entries()];
  let k = 0;
  await Promise.all(
    Array.from({ length: AT_ONCE }, async () => {
      while (k < hosts.length) {
        const [h, list] = hosts[k++];
        for (const u of list) {
          results[u] = await probe(u);
          await sleep(gapFor(h));
        }
      }
    }),
  );
}
save();

const vals = Object.values(results);
const n = (f: (r: Result) => boolean) => vals.filter(f).length;
console.log(
  `Wrote ${vals.length} results to data/audits/link-health.json in ${Math.round((Date.now() - started) / 1000)} s: ${n((r) => r.ok === true)} respond, ${n((r) => r.ok === false && (r.status === 404 || r.status === 410 || r.note === 'no such host'))} gone, ${n((r) => r.ok === false && !(r.status === 404 || r.status === 410 || r.note === 'no such host'))} errors, ${n((r) => r.ok === null)} unknown.`,
);
