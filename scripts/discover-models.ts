// Finds new models and writes data/discovered-models.json, a review queue that the New page lists.
//
// Models reach the almanac three other ways: Epoch AI's data (sync-epoch.ts adds every model Epoch scores),
// launch posts cataloged by hand, and leaderboard rows. Epoch can take weeks, so this job looks sooner:
// Hugging Face (lab accounts and the trending list), AINews, Bluesky, and new names on the leaderboards. The
// readers live in scripts/lib/discover/models.ts.
//
// A find leaves the queue once its name matches a record in data/models.json, after 21 days with no new
// mention, or when its name key is in the store's `dismissed` list (add one there to drop a find for good).
//
// usage: node scripts/discover-models.ts [--days 3] [--only <reader>] [--dry]
import { existsSync } from 'node:fs';
import { readJson, writeJson, dataPath, daysAgo } from './lib/util.ts';
import { FROM, TODAY, makeReader } from './lib/discover/core.ts';
import { HF_ORGS } from './lib/discover/labs.ts';
import { makeResolver } from './lib/models.ts';
import { hfLabs, hfTrending, ainewsModels, blueskyModels, labSites, boardNames, modelKey, modelScore, type ModelFind, type ModelReader, type Found, type ModelSource } from './lib/discover/models.ts';

interface Store {
  updated: string | null;
  items: ModelFind[];
  seen: Record<string, string[]>;
  dismissed: { key: string; name: string; reason: string; date: string }[];
}

const log = (...a: unknown[]) => console.log(...a);
const arg = (f: string) => (process.argv.includes(f) ? (process.argv[process.argv.indexOf(f) + 1] ?? '') : undefined);
const ONLY = arg('--only');
const DRY = process.argv.includes('--dry');
const path = dataPath('discovered-models.json');
const store: Store = existsSync(path) ? readJson<Store>(path) : { updated: null, items: [], seen: {}, dismissed: [] };
store.seen ??= {};
store.dismissed ??= [];

// ---- what we know: models, labs, and the Hugging Face accounts behind cataloged models ----------------
const resolve = makeResolver();
// a repo name often adds a mixture-of-experts size and a chat tag to the model's name: "Mistral-Large-4-1T-A52B"
// is Mistral Large 4. A plain size stays, since "Gemma-5-4B" and "Gemma 5" are different models.
const SIZE = /[-_ ]\d+(?:\.\d+)?[BMT][-_ ]A\d+(?:\.\d+)?B(?=$|[-_ ])/gi;
const TAG = /[-_ ](?:Instruct|Chat|it|hf|HF)$/;
const known = (name: string) => {
  const bare = name.replace(TAG, '');
  // a launch post often names a first version without its number: "Introducing Beam" is Beam 1.0
  return [name, bare, bare.replace(SIZE, ''), name.replace(/[-_]/g, ' '), `${bare} 1.0`].some((n) => n && resolve(n));
};
const labs = readJson<{ id: string; name: string; aliases?: string[] }[]>(dataPath('labs.json'));
const labByName = new Map(labs.flatMap((l) => [l.name, l.id, ...(l.aliases ?? [])].map((n) => [modelKey(n), l.id] as const)));
const models = readJson<{ lab: string; card?: string }[]>(dataPath('models.json'));
const cards = readJson<{ lab: string; url: string }[]>(dataPath('cards.json'));
const hfCount = new Map<string, number>();
const labByHf = new Map<string, string>();
for (const { lab, url } of [...models.map((m) => ({ lab: m.lab, url: m.card ?? '' })), ...cards]) {
  const org = url.match(/^https?:\/\/huggingface\.co\/([\w.-]+)\/[\w.-]+/)?.[1];
  if (!org || /^(papers|datasets|spaces|blog|docs)$/.test(org)) continue;
  hfCount.set(org, (hfCount.get(org) ?? 0) + 1);
  if (!labByHf.has(org.toLowerCase())) labByHf.set(org.toLowerCase(), lab);
}
// the accounts behind three or more cataloged models or launch posts, and the labs the card reader watches
const hfAccounts = [...new Set([...HF_ORGS, ...[...hfCount].filter(([, n]) => n >= 3).map(([o]) => o)])];
const labOf = (org: string | undefined) => (org ? (labByHf.get(org.toLowerCase()) ?? labByName.get(modelKey(org))) : undefined);

// ---- the queue ---------------------------------------------------------------------------------------
const dismissed = new Set(store.dismissed.map((d) => d.key));
const finds = new Map(store.items.map((f) => [f.key, f]));
const touched = new Set<string>();
function add(f: Found, s: ModelSource) {
  const k = modelKey(f.name);
  if (!k || dismissed.has(k) || known(f.name)) return;
  const cur: ModelFind = finds.get(k) ?? { key: k, name: f.name, url: f.url, first: TODAY, last: TODAY, sources: [], score: 0 };
  cur.last = TODAY;
  // a Hugging Face repo is the model's own page, so it wins over a news or post link
  if (s.kind.startsWith('hf') && !cur.url.includes('huggingface.co')) cur.url = f.url;
  for (const field of ['org', 'created', 'params', 'weights', 'license'] as const) if (f[field] !== undefined && cur[field] === undefined) (cur as unknown as Record<string, unknown>)[field] = f[field];
  if (f.likes !== undefined) cur.likes = Math.max(cur.likes ?? 0, f.likes);
  cur.lab ??= labOf(f.org);
  const same = cur.sources.find((x) => x.kind === s.kind);
  if (same) Object.assign(same, s);
  else cur.sources.push(s);
  finds.set(k, cur);
  touched.add(k);
}

const READERS: Record<string, { run: (x: ModelReader) => Promise<void> | void; seconds: number }> = {
  'hf-labs': { run: hfLabs, seconds: 120 },
  'hf-trending': { run: hfTrending, seconds: 60 },
  'lab-sites': { run: labSites, seconds: 150 },
  ainews: { run: ainewsModels, seconds: 60 },
  bluesky: { run: blueskyModels, seconds: 90 },
  // last, so a name a board lists can add evidence to a find from the other readers
  boards: {
    run: (x) => boardNames(x, readJson<{ others: [string, string][] }>(dataPath('scores', 'leaderboards.json')).others),
    seconds: 30,
  },
};
if (ONLY !== undefined && !READERS[ONLY]) throw new Error(`no reader "${ONLY}". Readers: ${Object.keys(READERS).join(', ')}`);

log(`Discovering models from ${FROM} to ${TODAY}${DRY ? ' (dry run: nothing is written)' : ''}`);
const rows: string[] = [];
for (const [id, spec] of Object.entries(READERS)) {
  if (ONLY && id !== ONLY) continue;
  const ctrl = new AbortController();
  const r = makeReader(id, ctrl.signal);
  const seen = { ...store.seen };
  const x: ModelReader = { r, from: FROM, add, known, labOf, hfAccounts, seen, finds };
  const t0 = Date.now();
  const before = touched.size;
  let status = 'ok';
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      spec.run(x),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => (ctrl.abort(), reject(new Error(`timed out after ${spec.seconds} s`))), spec.seconds * 1000);
      }),
    ]);
    store.seen = seen;
  } catch (e) {
    status = `failed: ${(e as Error).message}`.slice(0, 160);
  } finally {
    clearTimeout(timer);
    r.close(status === 'ok');
  }
  const notes = r.tally.notes.length ? ` (${[...new Set(r.tally.notes)].slice(0, 4).join('; ')})` : '';
  rows.push(`${id.padEnd(14)}${String(r.tally.read).padStart(6)}${String(touched.size - before).padStart(7)}${((Date.now() - t0) / 1000).toFixed(1).padStart(7)}  ${status}${notes}`);
}

const items = [...finds.values()]
  .filter((f) => !dismissed.has(f.key) && !known(f.name) && f.last >= daysAgo(21))
  .map((f) => ((f.score = modelScore(f)), f))
  .filter((f) => f.score >= 3)
  .sort((a, b) => b.score - a.score || b.last.localeCompare(a.last) || a.name.localeCompare(b.name));

if (DRY) for (const f of items.filter((f) => touched.has(f.key))) log(`  ${String(f.score).padStart(2)}  ${f.name}${f.org ? ` (${f.org})` : ''}  [${f.sources.map((s) => s.source).join('; ')}]  ${f.url}`);
else writeJson(path, { updated: TODAY, items, seen: store.seen, dismissed: store.dismissed } satisfies Store);
log(`\n${'Reader'.padEnd(14)}${'Read'.padStart(6)}${'Finds'.padStart(7)}${'Secs'.padStart(7)}  Status`);
for (const row of rows) log(row);
log(`\n${DRY ? 'Would write' : 'Wrote'} ${items.length} models to review (${items.filter((f) => f.score >= 6).length} with a score of 6 or more).`);
