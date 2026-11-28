// Reads every official leaderboard importer in scripts/leaderboards/ and writes the leaderboard store:
// data/scores/leaderboards.json and the rows files in data/scores/rows/ (scripts/lib/scores.ts). Model names map to data/models.json through the shared resolver plus each
// importer's own aliases. Entries the resolver cannot place (fine-tunes, agent systems, products, older models)
// go to `others` under the board's own name, so a benchmark page can still show the whole board. Only `rows`
// count toward leaders and lab credit. In `rows` the date is the model's release (so charts line up with Epoch);
// in `others`, which have no model record, it is the date the board gives, if any. A board that fails keeps its last rows, so one broken site never empties
// the data.
//
// usage: node scripts/sync-leaderboards.ts [--only id,id | --local] [--dry] [--allow-drop] [--parts-only] [--rematch]
// --local reads only the boards GitHub's runners can't reach (scripts/lib/local-boards.ts). On GitHub (GITHUB_ACTIONS
// set) a full sync skips them and keeps their last rows, and a maintainer's computer reads them with --local.
// --rematch reads no board either: it matches each board's stored unlisted entries again, so a model or alias added
// to data/models.json (or to an importer) takes effect without fetching anything.
// With --dry and SYNC_DUMP=<file>, each board's full rows, others and harness declarations are appended to that
// file as one JSON line, so a change to an importer can be compared with the rows it gave before.
import { readdirSync, existsSync, writeFileSync, appendFileSync } from 'node:fs';
import { begin, observe, review, type Flag } from './lib/feed-fields.ts';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, dataPath, readJson, today, bodyHooks } from './lib/util.ts';
import { readScores, writeScores } from './lib/scores.ts';
import { LOCAL_BOARDS } from './lib/local-boards.ts';
import { withoutNonModels } from './lib/not-models.ts';
import { makeResolver } from './lib/models.ts';
import type { BoardPart, BoardSource, Leaderboard, LeaderboardRow } from './leaderboards/types.ts';

// a board's parts as stored: each declared part the rows actually score, written out in full
function partsOf(board: Leaderboard, rows: Row[]): Record<string, BoardPart> | undefined {
  const scored = new Set(rows.flatMap((r) => Object.keys(r[8] ?? {})));
  const out = Object.entries(board.parts ?? {})
    .filter(([k]) => scored.has(k))
    .map(([k, p]): [string, BoardPart] => [k, typeof p === 'string' ? { name: p } : p]);
  const missing = Object.keys(board.parts ?? {}).filter((k) => !scored.has(k));
  if (missing.length) console.log(`    ${board.benchmark}: parts no row scores: ${missing.join(', ')}`);
  return out.length ? Object.fromEntries(out) : undefined;
}

// benchmark, model, setting, harness, score, date, cost (US dollars per task), tokens (output tokens per task),
// metrics (other numbers the board reports, such as latency) when it has any, and info (facts about the entry:
// who submitted it, the board's verified mark, a blend's models, the board's own date, a link to the run, trials
// and interval, the model's weights and size) when it has any. A row with info but no metrics has null metrics.
type Metrics = Record<string, number>;
interface Info {
  submitter?: string;
  agentOrg?: string;
  verified?: boolean;
  /** Model ids, or "~" and the board's name for a model we don't track. */
  models?: string[];
  /** The board's own date for the run, when the row's date column holds the model's release instead. */
  run?: string;
  link?: string;
  trials?: number;
  low?: number;
  high?: number;
  open?: boolean;
  license?: string;
  params?: number;
  /** The key of the other source the run came from (Leaderboard.sources), for a board that adds one. */
  source?: string;
}
type Row = [string, string, string | null, string | null, number, string | null, number | null, number | null, (Metrics | null)?, Info?];
const COLUMNS = ['benchmark', 'model', 'setting', 'harness', 'score', 'date', 'cost', 'tokens', 'metrics', 'info'];
// the same columns, with the board's own name for the entry in place of a model id
const OTHER_COLUMNS = ['benchmark', 'name', 'setting', 'harness', 'score', 'date', 'cost', 'tokens', 'metrics', 'info'];
interface Store {
  retrieved: string | null;
  boards: Record<string, { url: string; feed: string; terms: string; host?: string; headline?: string; static?: 'paper'; retrieved: string; rows: number; unmatched: string[]; chart?: Leaderboard['chart']; costPer?: 'run'; reference?: string[]; harnesses?: 'system'; verified?: string; parts?: Record<string, BoardPart>; stats?: Leaderboard['stats']; measures?: Record<string, string>; sources?: Record<string, BoardSource>; local?: true; failed?: { date: string; error: string } }>;
  columns: string[];
  rows: Row[];
  otherColumns?: string[];
  others?: Row[];
  // importers that have never read their board, so there are no board facts to carry a `failed` record
  unread?: Record<string, { since: string; date: string; error: string }>;
}

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : undefined;
};
// --parts-only reads no board: it only refreshes each board's declared parts and measure columns from its
// importer, so a new declaration shows without fetching anything
const partsOnly = process.argv.includes('--parts-only');
const rematch = process.argv.includes('--rematch');
const only = partsOnly || rematch ? [] : process.argv.includes('--local') ? Object.keys(LOCAL_BOARDS) : arg('--only')?.split(',');
const dry = process.argv.includes('--dry');

const clean = (s: string | undefined) => s?.replace(/\s+/g, ' ').trim() || undefined;
/** A board's "2023-5-11" as "2023-05-11", so dates compare as text and pass the data checks. */
const day = (d: string | null | undefined) => d?.trim().replace(/^(\d{4})-(\d{1,2})-(\d{1,2})$/, (_, y, m, dd) => `${y}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`) ?? d;
const finite = (v: unknown, digits = 5) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toPrecision(digits)) : undefined);
/**
 * The facts a board gives about one entry beyond its score, or undefined when it gives none. `runDiffers` is true
 * for a matched row, whose date column holds the model's release, so the board's own date goes in `run`.
 */
function infoOf(r: LeaderboardRow, resolve: ReturnType<typeof makeResolver>, runDiffers: boolean): Info | undefined {
  const i: Info = {};
  if (clean(r.submitter)) i.submitter = clean(r.submitter);
  if (clean(r.agentOrg)) i.agentOrg = clean(r.agentOrg);
  if (typeof r.verified === 'boolean') i.verified = r.verified;
  const names = [...new Set((r.models ?? []).map(clean).filter((n): n is string => !!n))];
  if (names.length > 1) i.models = names.map((n) => resolve(n, r.date)?.id ?? `~${n}`);
  if (runDiffers && r.date) i.run = r.date;
  if (r.link && /^https?:\/\/\S+$/.test(r.link.trim())) i.link = r.link.trim();
  if ((finite(r.trials) ?? 0) > 0) i.trials = Math.round(r.trials!);
  const low = finite(r.low);
  const high = finite(r.high);
  if (low !== undefined && high !== undefined && low <= high) Object.assign(i, { low, high });
  if (typeof r.open === 'boolean') i.open = r.open;
  if (clean(r.license)) i.license = clean(r.license);
  if ((finite(r.params, 4) ?? 0) > 0) i.params = finite(r.params, 4);
  if (r.source) i.source = r.source;
  return Object.keys(i).length ? i : undefined;
}

const outPath = dataPath('scores', 'leaderboards.json');
const store: Store = existsSync(outPath)
  ? (readScores() as unknown as Store)
  : { retrieved: null, boards: {}, columns: COLUMNS, rows: [] };
const benchmarks = new Set(readJson<{ id: string }[]>(dataPath('benchmarks.json')).map((b) => b.id));
// the field watch: every body an importer fetches is noted, and fields of a kind the rows don't store are flagged for
// review in data/scores/field-review.json. data/field-decisions.json holds the fields a person already reviewed.
bodyHooks.push(observe);
const fieldsPath = dataPath('scores', 'feed-fields.json');
const reviewPath = dataPath('scores', 'field-review.json');
const decisionsPath = dataPath('field-decisions.json');
const feedFields: Record<string, string[]> = existsSync(fieldsPath) ? readJson<{ boards: Record<string, string[]> }>(fieldsPath).boards : {};
const fieldReview: Record<string, Flag[]> = existsSync(reviewPath) ? readJson<{ boards: Record<string, Flag[]> }>(reviewPath).boards : {};
const decided: Record<string, Record<string, unknown>> = existsSync(decisionsPath) ? readJson<{ boards: Record<string, Record<string, unknown>> }>(decisionsPath).boards : {};
const released = new Map(readJson<{ id: string; released?: string }[]>(dataPath('models.json')).map((m) => [m.id, m.released]));
// names that mean one model on one board only, from reviews that read the board's own page (data/board-aliases.json)
const boardAliases: Record<string, Record<string, string>> = existsSync(dataPath('board-aliases.json')) ? readJson<{ boards: Record<string, Record<string, string>> }>(dataPath('board-aliases.json')).boards : {};
const aliasesOf = (board: Leaderboard) => ({ ...(boardAliases[board.benchmark] ?? {}), ...(board.aliases ?? {}) });

// a board's measure columns as stored: each declared column the rows actually keep
function measuresOf(board: Leaderboard, rows: Row[]): Record<string, string> | undefined {
  const kept = new Set(rows.flatMap((r) => Object.keys(r[8] ?? {})));
  const out = Object.entries(board.measures ?? {}).filter(([k]) => kept.has(k));
  return out.length ? Object.fromEntries(out) : undefined;
}

// an interval bound or a spread describes another number, so it is never a measure of its own (BoardMeasures.astro
// skips the same keys)
const SPREAD = /^(low|high|lo|hi|lower|upper|ci\d*|ciLow|ciHigh|stderr|std|sd|se|var|variance|rankLow|rankHigh)$|^(low|high|lo|hi|lower|upper|ci\d*|stderr|std|sd|se|var|variance)[:_\s-]|(^|[_\s:-])(lo|hi|low|high|lower|upper|ci\d*|se|sd|std|stderr|var|variance)$|[a-zA-Z0-9](Lo|Hi|Low|High|Lower|Upper|Ci\d*|Se|Sd|Std|Stderr|Var|Variance|LowerBound|UpperBound)$/;

// a board's other measures as stored: each declared stat the rows actually keep, leaving out parts and spreads
function statsOf(board: Leaderboard, rows: Row[], parts: Record<string, unknown> | undefined): Leaderboard['stats'] {
  const kept = new Set(rows.flatMap((r) => Object.keys(r[8] ?? {})));
  const out = Object.entries(board.stats ?? {}).filter(([k]) => (kept.has(k) || k === 'cost' || k === 'tokens') && !(parts && k in parts) && !SPREAD.test(k));
  return out.length ? Object.fromEntries(out) : undefined;
}

// the stored rows and unlisted entries of one board, grouped once
let byBoard: Map<string, Row[]> | undefined;
function storedRows(id: string): Row[] {
  if (!byBoard) {
    byBoard = new Map();
    for (const r of [...store.rows, ...(store.others ?? [])]) {
      const list = byBoard.get(r[0]);
      if (list) list.push(r);
      else byBoard.set(r[0], [r]);
    }
  }
  return byBoard.get(id) ?? [];
}

/**
 * A row's setting: the board's own, else the one the name carried ("o3 (high)"). A setting that is part of the
 * model's name ("GLM-5.3 Prime") joins the board's, so "GLM-5.3 Prime" at max never reads as GLM-5.3 at max.
 */
function settingOf(own: string | null | undefined, hit: { setting?: string; variant?: true }): string | null {
  if (hit.variant && hit.setting && own && own !== hit.setting) return `${hit.setting}, ${own}`;
  return own ?? hit.setting ?? null;
}

// --rematch: one board's stored unlisted entries that now resolve move to its rows, the way a fresh read would put
// them: the model's release in the date column and the board's own date in info.run
let rematched = 0;
function rematchBoard(board: Leaderboard) {
  const resolve = makeResolver(aliasesOf(board));
  const moved: Row[] = [];
  const left: Row[] = [];
  for (const o of (store.others ?? []).filter((r) => r[0] === board.benchmark)) {
    const hit = resolve(o[1], o[5] ?? undefined);
    if (!hit) {
      left.push(o);
      continue;
    }
    const [, , setting, harness, score, date, cost, tokens, metrics, info] = o;
    const i: Info = { ...(info ?? {}), ...(date ? { run: date } : {}) };
    const extra = Object.keys(i).length ? [metrics ?? null, i] : metrics ? [metrics] : [];
    moved.push([board.benchmark, hit.id, settingOf(setting, hit), harness, score, released.get(hit.id) ?? date ?? null, cost ?? null, tokens ?? null, ...extra] as Row);
  }
  if (!moved.length) return;
  rematched += moved.length;
  store.rows = store.rows.concat(moved);
  store.others = (store.others ?? []).filter((r) => r[0] !== board.benchmark).concat(left);
  const kept = store.boards[board.benchmark];
  kept.rows = store.rows.filter((r) => r[0] === board.benchmark).length;
  kept.unmatched = [...new Set(left.map((r) => r[1]))].sort();
  console.log(`  ${board.benchmark}: ${moved.length} unlisted entries now match (${[...new Set(moved.map((r) => r[1]))].join(', ')})`);
}

// A fixed source (a paper's results table) gains no models, so a full sync reads it once in each 30-day cycle, on a
// day set by its id so the reads spread across the month, or when 45 days have passed since its last read. Reading
// every paper on every run would cost an hour or more, since arXiv asks for 15 seconds between requests.
const dayNumber = (d: string) => Math.floor(Date.parse(d) / 86_400_000);
function readsStaticToday(id: string, retrieved: string | undefined): boolean {
  if (!retrieved) return true;
  const now = dayNumber(today());
  const age = now - dayNumber(retrieved);
  const slot = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 30;
  return age >= 45 || (age >= 1 && now % 30 === slot);
}

const dir = join(ROOT, 'scripts', 'leaderboards');
const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'types.ts');
let failed = 0;
const seen = new Set<string>();
for (const f of files) {
  let board: Leaderboard | undefined;
  try {
    board = (await import(pathToFileURL(join(dir, f)).href)).default as Leaderboard | undefined;
  } catch (e) {
    // one importer that does not load must not stop the others
    console.log(`  ${f}: failed to load (${(e as Error).message})`);
    failed++;
    continue;
  }
  if (!board?.benchmark || typeof board.fetch !== 'function') {
    console.log(`  ${f}: has no default-exported Leaderboard`);
    failed++;
    continue;
  }
  seen.add(board.benchmark).add(f.replace(/\.ts$/, ''));
  // who runs a board is the importer's own fact, so every run refreshes it, also for boards it does not read
  const kept = store.boards[board.benchmark];
  if (!dry && kept) {
    if (board.host) kept.host = board.host;
    else delete kept.host;
    // and so is how it makes the headline score
    if (board.headline) kept.headline = board.headline;
    else delete kept.headline;
    if (board.static) kept.static = board.static;
    else delete kept.static;
    // and the other sources it reads beside the board
    if (board.sources) kept.sources = board.sources;
    else delete kept.sources;
    // and whether only a maintainer's computer can read it
    if (LOCAL_BOARDS[f.replace(/\.ts$/, '')]) kept.local = true;
    else delete kept.local;
    // so are the parts it declares up front. Parts an importer sets inside fetch() wait for its next read.
    // A refresh only adds or renames: parts an importer sets inside fetch() aren't declared here, so the stored ones
    // stay until its next read rewrites them all.
    if (board.parts) {
      const parts = { ...(kept.parts ?? {}), ...(partsOf(board, storedRows(board.benchmark)) ?? {}) };
      if (Object.keys(parts).length) kept.parts = parts;
      else delete kept.parts;
    }
    // and the other measures it labels, once the parts are settled. Like parts, stats an importer sets inside
    // fetch() aren't declared up front, so a refresh keeps the stored ones until its next read rewrites them all.
    // (Until 2026-11-24 a refresh dropped them, so every --only run stripped other boards' stats, such as
    // replibench-aisi's, until the next full sync.)
    const declared = statsOf(board, storedRows(board.benchmark), kept.parts) ?? {};
    const fromFetch = Object.entries(kept.stats ?? {}).filter(([k]) => !(board.stats && k in board.stats));
    const stats = { ...Object.fromEntries(fromFetch), ...declared };
    if (Object.keys(stats).length) kept.stats = stats;
    else delete kept.stats;
    if (board.measures) {
      const measures = measuresOf(board, storedRows(board.benchmark));
      if (measures) kept.measures = measures;
      else delete kept.measures;
    }
  }
  if (rematch && !dry && kept) rematchBoard(board);
  if (only && !only.includes(board.benchmark) && !only.includes(f.replace(/\.ts$/, ''))) continue;
  // a paper's table read beside a live source, such as Kaggle's runs, is read every run so the live rows stay current
  if (!only && kept && board.static && !board.sources && !readsStaticToday(board.benchmark, kept.retrieved)) continue;
  if (!only && process.env.GITHUB_ACTIONS && LOCAL_BOARDS[f.replace(/\.ts$/, '')]) continue;
  if (!benchmarks.has(board.benchmark)) {
    console.log(`  ${f}: unknown benchmark ${board.benchmark}`);
    failed++;
    continue;
  }
  const resolve = makeResolver(aliasesOf(board));
  try {
    begin();
    // people, random guessing and oracles are not models, so no board keeps them (scripts/lib/not-models.ts)
    const raw = withoutNonModels(await board.fetch(), board.notModels);
    {
      const watched = review(raw, feedFields[board.benchmark], new Set(Object.keys(decided[board.benchmark] ?? {})));
      if (watched.fields.length) feedFields[board.benchmark] = watched.fields;
      if (watched.flags.length) fieldReview[board.benchmark] = watched.flags;
      else delete fieldReview[board.benchmark];
      if (dry && watched.flags.length) console.log(`    field watch: ${watched.flags.map((f) => `${f.field} (${f.kind}, ${f.why})`).join(', ')}`);
    }
    const rows: Row[] = [];
    const others: Row[] = [];
    const unmatched = new Set<string>();
    for (const r of raw) {
      if (!Number.isFinite(r.score)) continue;
      if (r.source && !board.sources?.[r.source]) throw new Error(`row source ${r.source} is not in the board's sources`);
      if (r.date) r.date = day(r.date)!;
      const cost = typeof r.cost === 'number' && r.cost > 0 ? Number(r.cost.toPrecision(4)) : null;
      const tokens = typeof r.tokens === 'number' && r.tokens > 0 ? Math.round(r.tokens) : null;
      // two decimals, or four for scores under 10, so a 0-to-1 board keeps 0.602 apart from 0.600
      const score = Math.abs(r.score) < 10 ? Math.round(r.score * 1e4) / 1e4 : Math.round(r.score * 100) / 100;
      const metrics = Object.fromEntries(Object.entries(r.metrics ?? {}).filter(([, v]) => Number.isFinite(v)).map(([k, v]) => [k, Number(v.toPrecision(5))]));
      const hit = resolve(r.model, r.date);
      // a matched row's date column holds the model's release, so the board's own date goes in info.run
      const info = infoOf(r, resolve, !!hit);
      const extra: [(Metrics | null)?, Info?] = info ? [Object.keys(metrics).length ? metrics : null, info] : Object.keys(metrics).length ? [metrics] : [];
      if (!hit) {
        unmatched.add(r.model);
        const name = r.model.replace(/\s+/g, ' ').trim();
        if (name) others.push([board.benchmark, name, r.setting ?? null, r.harness ?? null, score, r.date ?? null, cost, tokens, ...extra]);
        continue;
      }
      // place the score at the model's release, like Epoch, so charts over time line up
      const date = released.get(hit.id) ?? r.date ?? null;
      rows.push([board.benchmark, hit.id, settingOf(r.setting, hit), r.harness ?? null, score, date, cost, tokens, ...extra]);
    }
    console.log(`  ${board.benchmark}: ${raw.length} rows, ${rows.length} matched${unmatched.size ? `, unmatched: ${[...unmatched].slice(0, 12).join(' | ')}` : ''}`);
    if (dry) {
      if (process.env.SYNC_DUMP)
        appendFileSync(process.env.SYNC_DUMP, JSON.stringify({ board: board.benchmark, reference: board.reference, harnesses: board.harnesses, verified: board.verified, parts: partsOf(board, [...rows, ...others]), rows, others }) + '\n');
      for (const r of rows.sort((a, b) => b[4] - a[4]).slice(0, 8)) console.log(`      ${r[4]}  ${r[1]}${r[2] ? ` (${r[2]})` : ''}${r[3] ? ` [${r[3]}]` : ''}${r[9] ? `  ${JSON.stringify(r[9]).slice(0, 160)}` : ''}`);
      continue;
    }
    if (!rows.length && !others.length) throw new Error('no rows');
    // a parser that breaks quietly often returns a handful of rows: keep the last good board instead
    const before = store.rows.filter((r) => r[0] === board.benchmark).length + (store.others ?? []).filter((r) => r[0] === board.benchmark).length;
    const now = rows.length + others.length;
    if (before >= 20 && now < before / 2 && !process.argv.includes('--allow-drop'))
      throw new Error(`${now} entries against ${before} last time; rerun with --allow-drop if the board really shrank`);
    store.rows = store.rows.filter((r) => r[0] !== board.benchmark).concat(rows);
    store.others = (store.others ?? []).filter((r) => r[0] !== board.benchmark).concat(others);
    const parts = partsOf(board, [...rows, ...others]);
    const stats = statsOf(board, [...rows, ...others], parts);
    const measures = measuresOf(board, [...rows, ...others]);
    store.boards[board.benchmark] = { url: board.url, feed: board.feed, terms: board.terms, ...(board.host ? { host: board.host } : {}), ...(board.headline ? { headline: board.headline } : {}), ...(board.static ? { static: board.static } : {}), ...(LOCAL_BOARDS[f.replace(/\.ts$/, '')] ? { local: true as const } : {}), retrieved: today(), rows: rows.length, unmatched: [...unmatched].sort(), ...(board.chart ? { chart: board.chart } : {}), ...(board.costPer === 'run' ? { costPer: 'run' as const } : {}), ...(board.reference?.length ? { reference: board.reference } : {}), ...(board.harnesses === 'system' ? { harnesses: 'system' as const } : {}), ...(board.verified ? { verified: board.verified } : {}), ...(parts ? { parts } : {}), ...(stats ? { stats } : {}), ...(measures ? { measures } : {}), ...(board.sources ? { sources: board.sources } : {}) };
    if (store.unread) delete store.unread[board.benchmark];
  } catch (e) {
    failed++;
    const error = (e as Error).message;
    console.log(`  ${board.benchmark}: failed, ${store.boards[board.benchmark] ? 'keeping the last rows' : 'and it has never read'} (${error})`);
    // record the failure, so the Contribute page can list the importer. The next good read replaces the record.
    const failure = { date: today(), error: error.replace(/\s+/g, ' ').slice(0, 200) };
    if (!dry && store.boards[board.benchmark]) store.boards[board.benchmark].failed = failure;
    // A board that never read has no facts to hold the record, so its failure goes in `unread`. Before 2026-11-23
    // these failures went unrecorded: the health report and the sync's retry never saw them, and nine importers
    // added on 2026-11-20 failed every day unnoticed.
    else if (!dry) (store.unread ??= {})[board.benchmark] = { since: store.unread?.[board.benchmark]?.since ?? today(), ...failure };
  }
}

const unknown = (only ?? []).filter((id) => !seen.has(id));
if (unknown.length) {
  console.log(`No importer for: ${unknown.join(', ')}`);
  process.exit(1);
}

if (!dry) {
  // on a full run, a board whose importer file is gone loses its rows
  if (!only)
    for (const id of Object.keys(store.boards))
      if (!seen.has(id)) {
        console.log(`  ${id}: no importer any more, rows removed`);
        delete store.boards[id];
      }
  if (!only) for (const id of Object.keys(store.unread ?? {})) if (!seen.has(id)) delete store.unread![id];
  store.rows = store.rows.filter((r) => store.boards[r[0]]);
  store.retrieved = today();
  store.columns = COLUMNS;
  // rows kept from a board that failed may predate the cost and tokens columns
  store.rows = store.rows.map((r) => [...r.slice(0, 6), r[6] ?? null, r[7] ?? null, ...(r[9] ? [r[8] ?? null, r[9]] : r[8] ? [r[8]] : [])] as Row);
  store.rows.sort((a, b) => a[0].localeCompare(b[0]) || (a[5] ?? '').localeCompare(b[5] ?? '') || a[1].localeCompare(b[1]));
  const others = (store.others ?? []).filter((r) => store.boards[r[0]]);
  others.sort((a, b) => a[0].localeCompare(b[0]) || b[4] - a[4] || a[1].localeCompare(b[1]));
  const boards = Object.fromEntries(Object.entries(store.boards).sort(([a], [b]) => a.localeCompare(b)));
  // the field watch's two files: what each feed publishes, and what to review
  const sortKeys = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).filter(([id]) => store.boards[id]).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(fieldsPath, `{\n  "note": "The record fields each board's feed published at the last sync (scripts/lib/feed-fields.ts).",\n  "boards": {\n${Object.entries(sortKeys(feedFields)).map(([id, f]) => `    ${JSON.stringify(id)}: ${JSON.stringify(f)}`).join(',\n')}\n  }\n}\n`);
  const flagged = sortKeys(fieldReview);
  writeFileSync(reviewPath, `{\n  "note": "Fields a board publishes that its importer may drop, or that the board added since the last sync. Wire them into the importer, or mark them reviewed in data/field-decisions.json.",\n  "updated": ${JSON.stringify(today())},\n  "boards": {\n${Object.entries(flagged).map(([id, f]) => `    ${JSON.stringify(id)}: ${JSON.stringify(f)}`).join(',\n')}\n  }\n}\n`);
  console.log(`Field watch: ${Object.keys(flagged).length} boards with fields to review (data/scores/field-review.json).`);
  const unread = Object.fromEntries(Object.entries(store.unread ?? {}).sort(([a], [b]) => a.localeCompare(b)));
  writeScores({ retrieved: store.retrieved, boards, unread, columns: store.columns, rows: store.rows, otherColumns: OTHER_COLUMNS, others });
  if (rematch) console.log(`Rematch: ${rematched} unlisted entries now match a model.`);
  console.log(`Wrote ${store.rows.length} leaderboard scores and ${others.length} unlisted entries from ${Object.keys(store.boards).length} boards.${failed ? ` ${failed} failed.` : ''}`);
}
// a few boards fail on any day (sites go down). More than a tenth failing means something broader broke.
if (failed > files.length / 10) {
  console.log(`${failed} of ${files.length} importers failed.`);
  process.exit(1);
}
