// X, read through Grok. X's terms forbid scraping, so this reader never fetches x.com. Grok Build, xAI's
// command-line agent, searches X with its own tools under the maintainer's Grok sign-in, and this reader asks it for
// the benchmark launches of the scan window. Added 2026-11-06, after ShadowBench, DeepFinance and FrontierPhysics
// launched on X and the scan missed them.
//
// It runs only where Grok Build is installed and signed in (a maintainer's computer), not in GitHub Actions. A scan
// is one short Grok run for each search part and each day of the window, a few at a time (see xSlices). Grok
// answers in JSON against a schema. Grok makes up post URLs, so every post is checked on FxTwitter's public mirror
// and every other link is fetched before it counts. The finds go to the review queue like any other feed.
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { key } from '../util.ts';
import { FROM, TODAY, GENERAL, NICHE, arxivId, githubRepo, seen, type Reader } from './core.ts';

const run = promisify(execFile);

export interface XLaunch {
  name: string;
  org?: string;
  post_url: string;
  links: string[];
  date: string;
  summary?: string;
  likes?: number;
}

const SCHEMA = {
  type: 'object',
  properties: {
    launches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          org: { type: 'string' },
          post_url: { type: 'string' },
          links: { type: 'array', items: { type: 'string' } },
          date: { type: 'string' },
          summary: { type: 'string' },
          likes: { type: 'integer' },
        },
        required: ['name', 'post_url', 'links', 'date'],
      },
    },
  },
  required: ['launches'],
};

// The search widened on 2026-11-18, after FrontierEE Bench (a company page and one post saying "Today we're
// introducing FrontierEE Bench") launched on X and a scan that returned 3 launches missed it. Names often end in
// "Bench" with no space, and small labs' posts have few likes, so the floor is 20. A Grok turn takes about 45 s, and
// one run doing a dozen searches timed out, so three short runs share the work in parallel. A run that finishes
// keeps its launches when another times out. A test on 2026-11-18 read 4 launches and found 2 new ones.
// On 2026-11-19 and 2026-11-20 the four-search launches run hit its 540 s limit and returned nothing, which missed
// KradleBench and MAC Bench (both launched 2026-11-18), so the launch searches ran as two parts with a longer limit.
// That was not enough: on 2026-11-20 and again on 2026-11-23 the launches part ran out of time and returned nothing
// (the scans in between had no network). The same search took 226 s in one run and more than 840 s in another, so
// since 2026-11-23 each run searches one part for one day, every part runs at most two searches, and a run that
// fails loses only its day, which the next scan searches again.
const ASK = (day: string, next: string) =>
  `Search X for posts made on ${day} (UTC), with since:${day} until:${next}, that announce a NEW AI benchmark, eval, or leaderboard for language models or AI agents: a launch by its makers, not commentary on an existing benchmark, and not a model or product launch.`;
const ANSWER =
  'Check every post with at least 20 likes, from labs, universities and startups alike. Return every launch you find, up to 30, or an empty list if there is none. For each launch, give the benchmark name, the organization, the URL of the announcing post, every non-X link in the post or its thread (paper, site, GitHub, Hugging Face), the post date, a one-sentence summary, and the like count. Return only launches you saw in actual posts. Do not guess links.';
export const X_SEARCHES = {
  launches: 'Run two searches: "new benchmark", and "introducing" with "benchmark".',
  releases: 'Run two searches: "today we\'re introducing" with "bench", and "we\'re releasing" with "eval".',
  names: 'Run two searches: "leaderboard" with "models", and "evals" with "frontier models".',
  bench: 'Run two searches: a new name ending in "Bench" (such as "FrontierEE Bench"), and "best model scored".',
  fields: 'Run two searches, each pairing "benchmark" with a group of fields: "engineering OR hardware OR robotics OR science", and "medicine OR law OR finance OR security".',
} as const;
export type XPart = keyof typeof X_SEARCHES;
export const xPrompt = (day: string, part: XPart = 'launches') => `${ASK(day, nextDay(day))} ${X_SEARCHES[part]} ${ANSWER}`;

const nextDay = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** One Grok run: one search part for one day (UTC). */
export interface XSlice {
  day: string;
  part: XPart;
}
export const sliceId = (s: XSlice) => `${s.day} ${s.part}`;

/** The runs a scan makes, newest day first: every part for every day from `from` through `to`, except the runs in `done`. */
export function xSlices(from: string, to: string, done: Iterable<string> = []): XSlice[] {
  const skip = new Set(done);
  const out: XSlice[] = [];
  for (let day = to; day >= from; day = new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10))
    for (const part of Object.keys(X_SEARCHES) as XPart[]) if (!skip.has(sliceId({ day, part }))) out.push({ day, part });
  return out;
}

/** Runs `fn` over `items`, at most `n` at a time, and starts no new item after `stopAt` (a time in ms). */
async function pool<T, R>(items: T[], n: number, stopAt: number, fn: (item: T) => Promise<R>): Promise<(PromiseSettledResult<R> | undefined)[]> {
  const out: (PromiseSettledResult<R> | undefined)[] = new Array(items.length).fill(undefined);
  let next = 0;
  const worker = async () => {
    while (next < items.length && Date.now() < stopAt) {
      const i = next++;
      out[i] = await fn(items[i]).then(
        (value) => ({ status: 'fulfilled', value }) as const,
        (reason) => ({ status: 'rejected', reason }) as const,
      );
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

/** What FxTwitter's public mirror says about one post. */
export interface XPost {
  url: string;
  created_at: string;
  likes: number;
  text: string;
  author: { screen_name: string };
}

/** Lowercase letters and digits only, for finding a benchmark's name in a page. */
const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The non-X links written in a post's text. */
export const postLinks = (text: string) =>
  [...new Set((text.match(/https?:\/\/[^\s<>"')\]]+/g) ?? []).map((u) => u.replace(/[.,;:!?]+$/, '')))].filter((u) => !/^https?:\/\/(?:[\w-]+\.)?(?:x|twitter)\.com\b|t\.co\//.test(u));

/** The top-level JSON objects in a string, in order, skipping text that does not parse. */
export function jsonObjects(s: string): unknown[] {
  const out: unknown[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = depth > 0;
    else if (c === '{') {
      if (depth++ === 0) start = i;
    } else if (c === '}' && depth > 0 && --depth === 0) {
      try {
        out.push(JSON.parse(s.slice(start, i + 1)));
      } catch {
        // not JSON after all, so it is skipped
      }
    }
  }
  return out;
}

/**
 * The launches in Grok's JSON answer, without X links. Grok sometimes leaves out the structured answer, or fills it
 * with an empty placeholder, and writes its answers one after another in the text instead. On 2026-11-23 that broke
 * 11 of 16 runs ("Unexpected non-whitespace character after JSON"), so every answer in the text counts too.
 */
export function xLaunches(stdout: string): XLaunch[] {
  const d = (jsonObjects(stdout).at(-1) ?? {}) as { structuredOutput?: { launches?: XLaunch[] }; text?: string };
  const answers = [d.structuredOutput, ...jsonObjects(d.text ?? '')] as ({ launches?: XLaunch[] } | undefined)[];
  const byPost = new Map<string, XLaunch>();
  for (const a of answers)
    for (const l of Array.isArray(a?.launches) ? a.launches : [])
      if (l?.name && typeof l.post_url === 'string' && /^https:\/\/(?:x|twitter)\.com\/\w+\/status\/\d+/.test(l.post_url))
        byPost.set(l.post_url, {
          ...l,
          links: [...new Set((Array.isArray(l.links) ? l.links : []).filter((u) => typeof u === 'string' && /^https?:\/\//.test(u) && !/^https?:\/\/(?:[\w-]+\.)?(?:x|twitter)\.com\b|t\.co\//.test(u)))],
        });
  return [...byPost.values()];
}

/**
 * The post on FxTwitter's public mirror (api.fxtwitter.com), which reads X without X's paid API. `null` when the
 * mirror says the post does not exist, which is how a URL Grok made up shows, and `undefined` when the mirror did
 * not answer.
 */
async function fxPost(r: Reader, postUrl: string): Promise<XPost | null | undefined> {
  const m = postUrl.match(/^https:\/\/(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/);
  if (!m) return null;
  try {
    const res = await r.request(`https://api.fxtwitter.com/${m[1]}/status/${m[2]}`, { timeout: 20_000 });
    return ((await res.json()) as { tweet?: XPost }).tweet ?? null;
  } catch (e) {
    return /HTTP 404\b/.test((e as Error).message ?? '') ? null : undefined;
  }
}

// Each Grok run gets 10 minutes. In a test on 2026-11-23, 16 runs for one part and one day took 31 s to 421 s
// (median about 200 s). Three hit the 420 s limit set then, and two of them were the four-search part, now split.
// Four run at a time, and no run starts in the last 13 minutes of the reader's 40, which leaves time for the post
// and link checks. Runs that never start count as failures and are made by the next scan.
const RUN_SECONDS = 600;
const AT_ONCE = 4;
export const X_SECONDS = 2400;
const DONE = 'xSlices';

/** Why a Grok run failed, in a few words: the error of a killed run quotes the whole prompt. */
const why = (e: unknown) => {
  const x = e as { killed?: boolean; signal?: string; stderr?: string; message?: string } | undefined;
  if (x?.killed || x?.signal === 'SIGTERM') return `no answer in ${RUN_SECONDS} s`;
  const text = String(x?.stderr || x?.message || e).replace(/^Command failed:[^\n]*\n?/, '').trim();
  return (text.split('\n').find(Boolean) ?? 'Grok failed').slice(0, 100);
};

export async function xGrok(r: Reader) {
  const bin = process.env.GROK_BIN ?? join(homedir(), '.grok', 'bin', 'grok');
  if (!existsSync(bin)) {
    r.note('Grok Build is not installed here, so X was not searched');
    return;
  }
  const started = Date.now();
  const ask = async ({ day, part }: XSlice): Promise<XLaunch[]> => {
    // an empty folder, so Grok has no project files or rules to read
    const dir = mkdtempSync(join(tmpdir(), 'grok-x-'));
    try {
      const { stdout } = await run(
        bin,
        [
          '-p',
          xPrompt(day, part),
          // search only: no shell, no file tools, no subagents
          '--disallowed-tools',
          'run_terminal_cmd,write,search_replace,read_file,grep,list_dir,Agent',
          '--max-turns',
          '10',
          '--output-format',
          'json',
          '--json-schema',
          JSON.stringify(SCHEMA),
          '--no-auto-update',
          '--cwd',
          dir,
        ],
        { cwd: dir, signal: r.signal, timeout: RUN_SECONDS * 1000, maxBuffer: 32 * 1024 * 1024 },
      );
      return xLaunches(stdout);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  // Only finished days (UTC) are searched, so a launch is found the day after its post. Runs an earlier scan
  // finished are skipped, so a scan after a failure makes only the runs that failed. The oldest day goes first,
  // since it leaves the window next.
  const done = new Set((seen[DONE] ?? []).filter((id) => id.slice(0, 10) >= FROM));
  const slices = xSlices(FROM, new Date(Date.parse(`${TODAY}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10), done).reverse();
  const timing: string[] = [];
  const got = await pool(slices, AT_ONCE, started + (X_SECONDS - RUN_SECONDS - 180) * 1000, async (s) => {
    const t0 = Date.now();
    try {
      return await ask(s);
    } finally {
      timing.push(`${sliceId(s)} ${Math.round((Date.now() - t0) / 1000)} s`);
    }
  });
  const failed: string[] = [];
  got.forEach((g, i) => {
    const id = sliceId(slices[i]);
    if (!g) failed.push(`${id}: not started in time`);
    else if (g.status === 'rejected') failed.push(`${id}: ${why(g.reason)}`);
    else done.add(id);
  });
  // a finished run is kept even when another run fails, so the next scan does not repeat it
  seen[DONE] = [...done].sort();
  if (timing.length) r.note(`Grok runs: ${timing.join(', ')}`);
  for (const f of failed) r.note(`failed ${f}`);
  if (slices.length && failed.length === slices.length) throw new Error(`every X search failed (${failed.length})`);

  const seenNames = new Map<string, XLaunch>();
  for (const g of got)
    if (g?.status === 'fulfilled')
      for (const l of g.value) {
        const had = seenNames.get(key(l.name));
        if (had) had.links = [...new Set([...had.links, ...l.links])];
        else seenNames.set(key(l.name), l);
      }
  const launches = [...seenNames.values()];
  r.read(launches.length);
  let madeUp = 0;
  for (const l of launches) {
    // the almanac never uses Artificial Analysis data, so its own benchmarks are not candidates
    if (/artificial\s*analysis|artificialanalysis\.ai/i.test(`${l.org ?? ''} ${l.links.join(' ')}`)) continue;
    // Grok makes up post URLs (on 2026-11-23 it gave a status ID that never existed for Hyper-Intervention), so the
    // post counts only when FxTwitter has it, and then its likes and links come from the post itself
    const post = await fxPost(r, l.post_url);
    if (post === null) madeUp++;
    const fromPost = new Set(post ? postLinks(post.text) : []);
    const links = [...new Set([...fromPost, ...l.links])].slice(0, 5);
    // A link counts only when it answers, and a link from Grok rather than the post only when its page names the
    // benchmark. In a test on 2026-11-23 Grok gave arXiv IDs that opened other people's papers.
    const name = flat(l.name);
    const live: string[] = [];
    for (const u of links) {
      const page = await r.text(u, { timeout: 20_000 }).catch(() => undefined);
      if (page !== undefined && (fromPost.has(u) || (name.length >= 3 && flat(page).includes(name)))) live.push(u);
    }
    if (live.length < links.length) r.note(`${l.name}: dropped ${links.length - live.length} link(s) that did not answer or did not name it`);
    // with no real post and no link that names it, nothing shows the launch exists
    if (!post && !live.length) {
      r.note(`${l.name}: dropped, ${post === null ? 'its post is not on X' : 'FxTwitter did not answer'} and no link names it`);
      continue;
    }
    const repo = live.map((u) => githubRepo(u)).find(Boolean);
    const site = live.find((u) => !arxivId(u) && !githubRepo(u));
    const text = `${l.name} ${l.summary ?? ''}`;
    r.add(
      {
        key: key(l.name),
        name: l.name,
        title: (l.summary ?? l.name).slice(0, 160),
        url: site ?? post?.url ?? live[0],
        org: l.org,
        arxiv: live.map((u) => arxivId(u)).find(Boolean),
        repo,
        // only a like count FxTwitter read counts, since Grok's counts are as unreliable as its URLs
        upvotes: post?.likes,
        introduced: true,
        stageA: 5,
        general: GENERAL.test(text),
        niche: NICHE.test(text),
      },
      { feed: 'X (via Grok)' },
    );
  }
  if (madeUp) r.note(`${madeUp} post URL(s) from Grok are not on X`);
  // a scan with a failed run is a failed scan, so the maintainer's job tries again, but the finds above still count
  if (failed.length) throw new Error(`${failed.length} of ${slices.length} X searches failed`);
}
