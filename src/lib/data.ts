// Loads data/ once per build, checks every cross-reference, and derives the summaries pages use.
// A broken reference (a card naming a model that is not in models.json) fails the build.

import labsJson from '../../data/labs.json';
import modelsJson from '../../data/models.json';
import benchmarksJson from '../../data/benchmarks.json';
import resourcesJson from '../../data/resources.json';
import cardsJson from '../../data/cards.json';
import systemCardsJson from '../../data/system-cards.json';
import epochJson from '../../data/scores/epoch.json';
// Imported as text, not as JSON: the dev server turns a JSON object into a literal module, and past about 30 MB it
// cannot parse that, so every page fails. One string parses fine, and the dev server still reloads when it changes.
import leaderboardsText from '../../data/scores/leaderboards.json?raw';
// the store keeps each board's rows in data/scores/rows/<first character of the board id>.json (scripts/lib/scores.ts)
const leaderboardRowTexts = import.meta.glob<string>('../../data/scores/rows/*.json', { query: '?raw', import: 'default', eager: true });
import harnessesJson from '../../data/harnesses.json';
import intervalsJson from '../../data/intervals.json';
import type { Benchmark, Card, Harness, Lab, Model, Resource, Score, ScoreInfo } from './types.ts';
import { areaOf } from './taxonomy.ts';

export const labs = labsJson as Lab[];
export const models = modelsJson as Model[];
export const benchmarks = benchmarksJson as Benchmark[];
export const resources = resourcesJson as Resource[];
/** Launch posts: the headline results a lab chose to show for a release. */
export const cards = (cardsJson as Card[]).map((c) => ({ ...c, kind: 'launch' as const })).sort((a, b) => a.date.localeCompare(b.date));
/** System cards, model cards and technical reports: every result the longer documents report. */
export const systemCards = (systemCardsJson as unknown as Card[])
  .map((c) => ({ ...c, kind: 'system-card' as const }))
  .sort((a, b) => a.date.localeCompare(b.date));

export const labById = new Map(labs.map((l) => [l.id, l]));
export const modelById = new Map(models.map((m) => [m.id, m]));
export const benchById = new Map(benchmarks.map((b) => [b.id, b]));
export const cardById = new Map(cards.map((c) => [c.id, c]));

type ScoreRow = [string, string, string | null, string | null, number, string | null];
// Epoch rows add secondary metrics, then where Epoch got the score (scripts/lib/epoch-provenance.ts): 'epoch' for
// its own run, or 'board', 'lab', 'paper' or 'unknown' for a score it collected, and the source it names
type Via = 'epoch' | 'board' | 'lab' | 'paper' | 'unknown';
type EpochRow = [...ScoreRow, (Record<string, number> | null)?, Via?, (string | null)?];
// leaderboard rows add cost (US dollars per task), output tokens per task, metrics, and what the board says about
// the entry (null metrics when a row has info but no metrics)
type BoardRow = [...ScoreRow, (number | null)?, (number | null)?, (Record<string, number> | null)?, ScoreInfo?];
const epoch = epochJson as unknown as {
  source: string;
  url: string;
  license: string;
  retrieved: string;
  rows: EpochRow[];
  eci: { model: string; eci: number | null; low: number | null; high: number | null }[];
};
export const EPOCH_SOURCE = { name: epoch.source, url: epoch.url, license: epoch.license, retrieved: epoch.retrieved };

export interface ChartAxis {
  key: string;
  label: string;
  unit?: string;
  better?: 'higher' | 'lower';
  log?: boolean;
}
/** A chart a board draws from more than its headline score (scripts/leaderboards/types.ts). */
export interface BoardChart {
  title: string;
  x: ChartAxis;
  y: ChartAxis;
  note?: string;
}
type Board = {
  url: string;
  feed: string;
  terms: string;
  host?: string;
  /** How the importer made the headline score when the source gives no overall score. */
  headline?: string;
  /** 'paper' when the scores come from a fixed table in the benchmark's paper. */
  static?: 'paper';
  retrieved: string;
  rows: number;
  unmatched: string[];
  chart?: BoardChart;
  costPer?: 'run';
  /** Harness names that are the board's own way of running every model. */
  reference?: string[];
  /** 'system': other harness names on the board are agents built around the model, shown as their own entries. */
  harnesses?: 'system';
  /** What the board's verified mark means. */
  verified?: string;
  /** The parts of the benchmark the board scores on their own, by metric key (scripts/leaderboards/types.ts). */
  parts?: Record<string, BoardPart>;
  /** The board's other numbers for each run, with names, units and directions (scripts/leaderboards/types.ts). */
  stats?: Record<string, { name: string; unit?: string; better?: 'higher' | 'lower'; note?: string }>;
  /** Columns that hold another of the benchmark's measures: metric key -> measure id (Benchmark.measures). */
  measures?: Record<string, string>;
  /** Other sources whose runs of the same open test the board adds, by the key their rows carry in info.source. */
  sources?: Record<string, { name: string; url: string; feed: string; terms: string }>;
  /** true when GitHub's runners can't read the board, so a maintainer's computer reads it (scripts/lib/local-boards.ts). */
  local?: true;
  failed?: { date: string; error: string };
};
/** One part of a benchmark a board scores on its own: a subject, language, difficulty or user group. */
export interface BoardPart {
  name: string;
  group?: string;
  note?: string;
  unit?: string;
  better?: 'higher' | 'lower';
}
const lb = JSON.parse(leaderboardsText) as { retrieved: string | null; boards: Record<string, Board>; rows: BoardRow[]; others?: BoardRow[] };
if (!Array.isArray(lb.rows)) {
  lb.rows = [];
  lb.others = [];
  for (const [, text] of Object.entries(leaderboardRowTexts).sort(([a], [b]) => (a < b ? -1 : 1))) {
    const shard = JSON.parse(text) as { rows?: BoardRow[]; others?: BoardRow[] };
    for (const r of shard.rows ?? []) lb.rows.push(r);
    for (const r of shard.others ?? []) lb.others.push(r);
  }
}
/** Official leaderboards: the boards each benchmark's makers publish, read by scripts/sync-leaderboards.ts. */
export const LEADERBOARDS = lb.boards;

/** What a board's "±" is, checked against the board's own pages (data/intervals.json). */
export interface IntervalInfo {
  kind: string;
  level?: number;
  method?: string;
  /** Whether the board publishes the bounds, or our importer builds them from the board's numbers. */
  by: 'board' | 'importer';
  says: 'stated' | 'implied' | 'inferred' | 'not found';
  url?: string;
  quote?: string;
}
export const INTERVALS = (intervalsJson as { boards: Record<string, IntervalInfo> }).boards;
/** The interval in words: "95% confidence interval", or "confidence interval (the board gives no level)". */
export function intervalName(id: string): string | undefined {
  const i = INTERVALS[id];
  if (!i) return undefined;
  if (i.kind === 'standard error') return 'one standard error either side';
  if (i.kind === 'standard deviation') return 'one standard deviation either side';
  return i.level ? `${i.level}% ${i.kind}` : `${i.kind} (the board gives no level)`;
}

// ---- integrity ------------------------------------------------------------------------------------
{
  const errors: string[] = [];
  const need = (ok: unknown, msg: string) => ok || errors.push(msg);
  for (const m of models) need(!m.lab || labById.has(m.lab), `model ${m.id}: unknown lab ${m.lab}`);
  for (const c of cards) {
    need(labById.has(c.lab), `card ${c.id}: unknown lab ${c.lab}`);
    need(modelById.has(c.model), `card ${c.id}: unknown model ${c.model}`);
    for (const r of c.results) need(benchById.has(r.benchmark), `card ${c.id}: unknown benchmark ${r.benchmark}`);
  }
  for (const b of benchmarks) need(!b.successor || benchById.has(b.successor), `benchmark ${b.id}: unknown successor ${b.successor}`);
  for (const r of [...epoch.rows, ...lb.rows]) {
    need(benchById.has(r[0]), `score row: unknown benchmark ${r[0]}`);
    need(modelById.has(r[1]), `score row: unknown model ${r[1]}`);
  }
  const ids = new Set<string>();
  for (const x of [...labs.map((l) => `lab:${l.id}`), ...models.map((m) => `model:${m.id}`), ...benchmarks.map((b) => `bench:${b.id}`)]) {
    need(!ids.has(x), `duplicate id ${x}`);
    ids.add(x);
  }
  if (errors.length) throw new Error(`data/ has ${errors.length} broken references:\n${errors.slice(0, 40).join('\n')}`);
}

// ---- dates ----------------------------------------------------------------------------------------
/** The data's "today": the newest card or score snapshot, whichever is later. */
export const AS_OF = [epoch.retrieved, ...(lb.retrieved ? [lb.retrieved] : []), ...cards.map((c) => c.date)].sort().at(-1)!;

export function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

// ---- scores ---------------------------------------------------------------------------------------
const PCT_UNIT = /^\s*(%|f1|anls ?%|anls x100|% win|accuracy|pass@1|percent|)\s*$/i;
export const isPercent = (unit: string | null | undefined) => PCT_UNIT.test(unit ?? '');

/** Card units come as written ("Elo", "score/10", "ANLS %"). Fold them to the units the registry uses. */
export function normUnit(u: string | null | undefined): string {
  if (isPercent(u)) return '%';
  const s = (u ?? '').toLowerCase();
  if (s.includes('elo')) return 'elo';
  if (s === 'usd' || s === '$') return 'usd';
  if (s === 'index') return 'index';
  return 'score';
}

// ---- harnesses ------------------------------------------------------------------------------------
/** Harnesses and agents we know by name (data/harnesses.json). */
export const harnesses = harnessesJson as Harness[];
const hkey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const harnessByKey = new Map(harnesses.flatMap((h) => [h.name, h.id, ...h.aliases].map((n) => [hkey(n), h] as const)));
export const harnessOf = (name: string | null | undefined) => (name ? harnessByKey.get(hkey(name)) : undefined);
const labByKey = new Map(labs.flatMap((l) => [l.id, l.name, ...(l.aliases ?? [])].map((n) => [hkey(n), l.id] as const)));

/**
 * Whether a lab's own agent, run on the lab's own model (Claude Code with a Claude model), counts as the model's
 * score. When false, it shows as its own entry, like an agent made by someone else.
 */
export const LAB_AGENT_IS_MODEL = true;

/**
 * What a board entry is, by the harness it ran in. A board decides what its harness names mean
 * (scripts/leaderboards/types.ts): only a board marked `harnesses: 'system'` has agent entries.
 * - `model`: the model on its own, in the board's reference harness, a neutral one, or none named.
 * - `lab`: the model in its own maker's agent (Claude Code with a Claude model).
 * - `agent`: an agent or product someone else built around the model ("Arca" for Arca + GPT-6 Astra).
 * - `blend`: an entry that uses several models.
 */
export type EntryKind = 'model' | 'lab' | 'agent' | 'blend';
export function entryKind(benchmark: string, model: string, harness: string | null | undefined, info?: ScoreInfo): EntryKind {
  const h = harness?.trim();
  if ((info?.models?.length ?? 0) > 1) return 'blend';
  const board = lb.boards[benchmark];
  if (!h || board?.harnesses !== 'system') return 'model';
  if (board.reference?.some((r) => hkey(r) === hkey(h))) return 'model';
  // a submission named after its own model ("GPT-4" on GPT-4) is the model on its own
  const m = modelById.get(model);
  if (m && [m.name, m.id, ...(m.aliases ?? []), m.epoch ?? ''].some((n) => n && hkey(n) === hkey(h))) return 'model';
  const known = harnessOf(h);
  if (known?.kind === 'reference') return 'model';
  const maker = known?.maker ?? (info?.agentOrg ? labByKey.get(hkey(info.agentOrg)) : undefined);
  return maker && maker === m?.lab ? 'lab' : 'agent';
}

/**
 * The views of a board that has agent entries: every entry, the runs that count as a model's own score, or only
 * runs in a standard harness. The benchmark page's Entries switch picks one for every chart of the official board.
 */
export type EntryView = 'every' | 'models' | 'same';
/** Whether an official-board score belongs in a view. Unlisted entries and agents appear only in `every`. */
export function inEntryView(s: Pick<Score, 'benchmark' | 'model' | 'harness' | 'info' | 'system'>, view: EntryView): boolean {
  if (view === 'every') return true;
  if (!s.model || s.system) return false;
  return view === 'models' || entryKind(s.benchmark, s.model, s.harness, s.info) === 'model';
}

/**
 * The agent a board entry runs in, when the entry doesn't count as the model's own score: "Arca" for Arca + GPT-6
 * Astra. Undefined for the model's own score, which by LAB_AGENT_IS_MODEL includes its maker's own agent.
 */
function systemOf(benchmark: string, model: string, harness: string | null | undefined, info?: ScoreInfo): string | undefined {
  const kind = entryKind(benchmark, model, harness, info);
  if (kind === 'model' || (kind === 'lab' && LAB_AGENT_IS_MODEL)) return undefined;
  return harness?.trim() || 'Several models';
}

/**
 * A row's interval, in one place. The standard home is info.low and info.high. Many importers wrote theirs as
 * metrics.ciLow and metrics.ciHigh before that existed, so those count too when they bracket the score, which
 * rules out an interval that belongs to a sub-score.
 */
function withInterval(value: number, metrics: Record<string, number> | null | undefined, info: ScoreInfo | null | undefined): ScoreInfo | undefined {
  if (info?.low !== undefined && info?.high !== undefined) return info;
  const lo = metrics?.ciLow;
  const hi = metrics?.ciHigh;
  if (typeof lo !== 'number' || typeof hi !== 'number' || !Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo || value < lo || value > hi) return info ?? undefined;
  return { ...(info ?? {}), low: lo, high: hi };
}

/** Every run on the official boards that resolves to a model we track, before the split into models and systems. */
const boardRuns: Score[] = lb.rows.map(([benchmark, model, setting, harness, value, date, cost, tokens, metrics, rowInfo]) => {
  const info = withInterval(value, metrics, rowInfo);
  const system = systemOf(benchmark, model, harness, info);
  return {
    benchmark,
    model,
    value,
    unit: benchById.get(benchmark)?.unit ?? '%',
    setting,
    harness,
    date: date ?? modelById.get(model)?.released ?? null,
    cost: cost ?? null,
    tokens: tokens ?? null,
    ...(metrics ? { metrics } : {}),
    ...(info ? { info } : {}),
    ...(system ? { system } : {}),
    source: 'leaderboard' as const,
  };
});

/** Official leaderboard scores of models on their own: these count toward leaders, reigns and lab credit. */
export const leaderboardScores: Score[] = boardRuns.filter((s) => !s.system);

/**
 * Entries that are an agent or product built around a model we track ("Arca + GPT-6 Astra"), or that use several
 * models. Pages show them on their benchmark's board under the agent's name. They never count as the model's score.
 */
export const systemScores: Score[] = boardRuns.filter((s) => !!s.system);

const nameOf = (id: string) => (id.startsWith('~') ? id.slice(1) : (modelById.get(id)?.name ?? id));
/** How a board entry reads: "Arca + GPT-6 Astra", "LemonHarness (Gemini 3.1 Pro + GPT-5.3 Codex)", or the model. */
export function entryLabel(s: Pick<Score, 'model' | 'name' | 'system' | 'info'>): string {
  const own = s.model ? nameOf(s.model) : (s.name ?? '');
  const blend = s.info?.models && s.info.models.length > 1 ? s.info.models.map(nameOf).join(' + ') : undefined;
  if (blend) return s.system && s.system !== 'Several models' ? `${s.system} (${blend})` : blend;
  return s.system ? `${s.system} + ${own}` : own;
}

/**
 * Entries on official leaderboards that are not in data/models.json, under the board's own name. Pages show them
 * on their benchmark's board. They never count toward leaders, reigns or lab credit.
 */
export const unlistedScores: Score[] = (lb.others ?? []).map(([benchmark, name, setting, harness, value, date, cost, tokens, metrics, rowInfo]) => {
  const info = withInterval(value, metrics, rowInfo);
  return {
    benchmark,
    model: '',
    name,
    value,
    unit: benchById.get(benchmark)?.unit ?? '%',
    setting,
    harness,
    date: date ?? null,
    cost: cost ?? null,
    tokens: tokens ?? null,
    ...(metrics ? { metrics } : {}),
    ...(info ? { info } : {}),
    source: 'leaderboard' as const,
  };
});

// An older epoch.json has no via column: its rows take the benchmark's kind, and collected ones name no source
const viaOf = (r: EpochRow): Via => r[7] ?? (benchById.get(r[0])?.epoch?.runs === 'external' ? 'unknown' : 'epoch');
const epochScore = (r: EpochRow) => ({
  benchmark: r[0],
  model: r[1],
  value: r[4],
  unit: benchById.get(r[0])?.unit ?? '%',
  setting: r[2],
  harness: r[3],
  date: r[5] ?? modelById.get(r[1])?.released ?? null,
});

const hostOf = (u: string | null | undefined) => (u ?? '').match(/https?:\/\/([^/\s?#]+)/i)?.[1].toLowerCase().replace(/^www\./, '') ?? '';
// the hosts of the boards the almanac reads itself, per benchmark: Epoch's copy of one of them is a duplicate
const readHosts = new Map(Object.entries(lb.boards).map(([id, x]) => [id, new Set([x.url, x.feed, ...Object.values(x.sources ?? {}).flatMap((o) => [o.url, o.feed])].map(hostOf).filter(Boolean))]));

// Epoch AI's own benchmarks (FrontierMath, SpireClimb and others) have a board the almanac reads from epoch.ai, and
// Epoch's data export holds the same runs. A run shows once: from the board when the board lists that model, and
// from the export when the board doesn't (the board leaves out some older models the export keeps). Since 2026-11-24.
const epochOwnBoardModels = new Map<string, Set<string>>();
for (const s of boardRuns) if (readHosts.get(s.benchmark)?.has('epoch.ai')) {
  if (!epochOwnBoardModels.has(s.benchmark)) epochOwnBoardModels.set(s.benchmark, new Set());
  epochOwnBoardModels.get(s.benchmark)!.add(s.model);
}

/** Epoch AI's own runs: independent, like a leaderboard. */
export const epochScores: Score[] = epoch.rows
  .filter((r) => viaOf(r) === 'epoch' && !epochOwnBoardModels.get(r[0])?.has(r[1]))
  .map((r) => ({ ...epochScore(r), source: 'epoch' as const }));

/**
 * Scores Epoch AI collected from somewhere else, and where from. A copy of a leaderboard the almanac reads
 * itself is dropped. A copy of another board ('board') counts as an independent run. A lab's report, a paper or
 * an unnamed source is a claim: it shows only where a page includes claimed scores.
 */
export const collectedScores: Score[] = epoch.rows
  .filter((r) => viaOf(r) !== 'epoch')
  // a copy of a board we read ourselves: the same host, or no link at all (Epoch often names the board only)
  .filter((r) => !(viaOf(r) === 'board' && readHosts.has(r[0]) && (!hostOf(r[8]) || readHosts.get(r[0])!.has(hostOf(r[8])))))
  .map((r) => ({ ...epochScore(r), source: 'collected' as const, via: viaOf(r) as Exclude<Via, 'epoch'>, from: r[8] ?? null }));
/** The collected scores that count as independent runs: copies of boards the almanac doesn't read itself. */
export const viaBoardScores = collectedScores.filter((x) => x.via === 'board');
/** The collected scores that are claims: a lab's report, a paper, or a source Epoch doesn't name. */
export const collectedClaims = collectedScores.filter((x) => x.via !== 'board');

/** A short name for where a collected score came from: the board or report Epoch names, or its site. */
export function fromName(x: Pick<Score, 'from'>): string {
  const f = (x.from ?? '').trim();
  if (!f) return 'a source Epoch AI doesn’t name';
  if (/^https?:\/\//i.test(f)) return hostOf(f);
  return f.length > 60 ? `${f.slice(0, 57).trimEnd()}…` : f;
}

/** Where a score came from, in a few words, for tooltips and tables. */
export function sourceLabel(x: Pick<Score, 'source' | 'via' | 'from'> & Partial<Pick<Score, 'benchmark' | 'info'>>): string {
  if (x.source === 'leaderboard') {
    const board = x.benchmark ? LEADERBOARDS[x.benchmark] : undefined;
    // a board that adds another source's runs names the source of each run (scripts/lib/boards/kaggle.ts)
    const other = x.info?.source ? board?.sources?.[x.info.source] : undefined;
    if (other) return `${other.name} run`;
    if (board?.host) return `${board.host} leaderboard`;
    if (board?.static === 'paper') return 'Benchmark paper';
    return 'Official leaderboard';
  }
  if (x.source === 'epoch') return 'Epoch AI run';
  if (x.source === 'card') return 'Lab model card';
  if (x.via === 'board') return `${fromName(x)}, via Epoch AI`;
  if (x.via === 'unknown') return 'Collected by Epoch AI, source not named';
  return `Claim in ${fromName(x)}, via Epoch AI`;
}

/** True for a lab's own number or a claim Epoch AI collected: anything nobody independent measured. */
export const isClaim = (x: Pick<Score, 'source' | 'via'>) => x.source === 'card' || (x.source === 'collected' && x.via !== 'board');
/** True for an independent rerun: Epoch AI's own run, or another board's run that Epoch AI copied. */
export const isRerun = (x: Pick<Score, 'source' | 'via'>) => x.source === 'epoch' || (x.source === 'collected' && x.via === 'board');

// the effort level a lab's wording states for a result ("xhigh effort", "max reasoning", "thinking: high"), kept as
// the score's setting so pages can show it beside the number
const EFFORT = /\b(none|minimal|low|medium|high|x-?high|max(?:imum)?)\s+(?:reasoning\s+)?(?:effort|reasoning|thinking)\b|\b(?:effort|reasoning|thinking)(?:\s+level)?[:=]?\s*\(?(none|minimal|low|medium|high|x-?high|max(?:imum)?)\b/i;
function effortOf(text: string | undefined): string | null {
  const m = text?.match(EFFORT);
  const w = (m?.[1] ?? m?.[2])?.toLowerCase().replace('-', '').replace('maximum', 'max');
  return w ? `${w} effort` : null;
}

/**
 * Card scores in the benchmark's own unit, on its headline measure. A score in another unit (an Elo beside
 * percentages) is left out, and so is a number on another of its measures (a partial-credit score beside a pass
 * rate, one part of the test), which measureScores keeps.
 */
export const cardScores: Score[] = [...cards, ...systemCards].flatMap((c) =>
  c.results
    .filter((r) => !r.measure)
    .filter((r) => r.score !== null && normUnit(r.unit) === (benchById.get(r.benchmark)?.unit ?? '%'))
    .filter((r) => normUnit(r.unit) !== '%' || ((r.score as number) >= 0 && (r.score as number) <= 100))
    .map((r) => ({
      benchmark: r.benchmark,
      model: c.model,
      value: r.score as number,
      unit: normUnit(r.unit),
      setting: effortOf(r.as_written),
      harness: null,
      date: c.date,
      source: 'card' as const,
      card: c.id,
    })),
);

/** A benchmark's other measures (Benchmark.measures), by id. */
export function measureOf(benchmark: string, id: string | undefined) {
  return id ? benchById.get(benchmark)?.measures?.find((m) => m.id === id) : undefined;
}
/**
 * Scores on a benchmark's other measures: the numbers labs report on them (a result's `measure`), and the board
 * columns that hold them (a board's `measures`, metric key -> measure id). Each is in the measure's own unit.
 */
export const measureScores: Score[] = [
  ...[...cards, ...systemCards].flatMap((c) =>
    c.results.flatMap((r): Score[] => {
      const m = measureOf(r.benchmark, r.measure);
      const unit = m?.unit ?? benchById.get(r.benchmark)?.unit ?? '%';
      if (!m || r.score === null || normUnit(r.unit) !== unit) return [];
      return [{ benchmark: r.benchmark, model: c.model, value: r.score, unit, setting: effortOf(r.as_written), harness: null, date: c.date, source: 'card', card: c.id, measure: m.id }];
    }),
  ),
  ...leaderboardScores.flatMap((s): Score[] => {
    const cols = lb.boards[s.benchmark]?.measures;
    if (!cols || !s.metrics) return [];
    return Object.entries(cols).flatMap(([key, id]) => {
      const m = measureOf(s.benchmark, id);
      const v = s.metrics![key];
      if (!m || !Number.isFinite(v)) return [];
      const { metrics: _m, ...rest } = s;
      return [{ ...rest, value: v, unit: m.unit ?? s.unit, measure: id }];
    });
  }),
];

function groupBy<T>(xs: T[], k: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of xs) {
    const key = k(x);
    const list = m.get(key);
    if (list) list.push(x);
    else m.set(key, [x]);
  }
  return m;
}

const epochByBench = groupBy(epochScores, (s) => s.benchmark);
const viaByBench = groupBy(viaBoardScores, (s) => s.benchmark);
const claimsByBench = groupBy(collectedClaims, (s) => s.benchmark);
const lbByBench = groupBy(leaderboardScores, (s) => s.benchmark);
const sysByBench = groupBy(systemScores, (s) => s.benchmark);
const unlistedByBench = groupBy(unlistedScores, (s) => s.benchmark);
const cardScoresByBench = groupBy(cardScores, (s) => s.benchmark);

/**
 * Whether a board's scores still update on their own. The daily sync reads every live board, and a paper's fixed
 * table about once a month. A board whose reads have failed for STOPPED_AFTER days or more has stopped updating: its
 * source moved, closed or blocks our reader, and the page keeps the scores from the last read that worked. So has a
 * board only a maintainer's computer can read (`local`) when that computer hasn't read it for STOPPED_AFTER days.
 */
export interface BoardUpdates {
  kind: 'daily' | 'paper' | 'stopped';
  /** The last read that worked. */
  last: string;
  /** Days from the last read that worked to the last sync. */
  days: number;
  /** For 'stopped': true when reads fail, false when a local board wasn't read. */
  failing?: boolean;
}
export const STOPPED_AFTER = 7;
export function boardUpdates(id: string): BoardUpdates | undefined {
  const board = LEADERBOARDS[id];
  if (!board?.retrieved || !(lbByBench.get(id)?.length || sysByBench.get(id)?.length || unlistedByBench.get(id)?.length)) return undefined;
  const days = lb.retrieved ? Math.max(0, Math.round((Date.parse(lb.retrieved) - Date.parse(board.retrieved)) / 86_400_000)) : 0;
  if ((board.failed || board.local) && days >= STOPPED_AFTER) return { kind: 'stopped', last: board.retrieved, days, failing: !!board.failed };
  // a paper's table beside a live source still gains models from that source
  return { kind: board.static === 'paper' && !board.sources ? 'paper' : 'daily', last: board.retrieved, days };
}
const citesByBench = groupBy(
  cards.flatMap((c) => c.results.map((r) => ({ card: c, result: r }))),
  (x) => x.result.benchmark,
);
const docCitesByBench = groupBy(
  systemCards.flatMap((c) => c.results.map((r) => ({ card: c, result: r }))),
  (x) => x.result.benchmark,
);

export const eciByModel = new Map(
  epoch.eci.filter((e) => e.eci !== null).map((e) => [e.model, { eci: e.eci!, low: e.low, high: e.high }]),
);

const better = (b: Benchmark) => (b.better === 'lower' ? -1 : 1);

/**
 * Best score per model, best first. Settings and harnesses of one model compete; the best one stays. A system entry
 * (an agent built around the model, or a blend) is its own entry, so it never takes the model's place.
 */
export function bestPerModel(scores: Score[], b: Benchmark): Score[] {
  const top = new Map<string, Score>();
  const sign = better(b);
  for (const s of scores) {
    // an unlisted entry has no model id, so its board name keys it
    const k = (s.model || `~${s.name}`) + (s.system ? `|${s.system}|${(s.info?.models ?? []).join('+')}` : '');
    const cur = top.get(k);
    if (!cur || sign * s.value > sign * cur.value) top.set(k, s);
  }
  return [...top.values()].sort((x, y) => sign * (y.value - x.value) || (x.date ?? '').localeCompare(y.date ?? ''));
}

/** The best score per model from one source, out of a summary's boards. */
export function boardOf(src: BoardSource | null, s: Pick<BenchSummary, 'leaderboardBoard' | 'epochBoard' | 'viaBoard' | 'cardBoard' | 'claimBoard'>): Score[] {
  return src === 'leaderboard' ? s.leaderboardBoard : src === 'epoch' ? s.epochBoard : src === 'collected' ? s.viaBoard : src === 'card' ? s.cardBoard : src === 'claim' ? s.claimBoard : [];
}

// ---- benchmark summaries --------------------------------------------------------------------------
export type Status = 'in use' | 'fading' | 'dropped' | 'system cards' | 'not in cards';

export interface FrontierPoint {
  date: string;
  value: number;
  model: string;
  source: Score['source'];
  via?: Score['via'];
  from?: string | null;
}

/**
 * One source a benchmark's page can lead with. 'collected' is a board Epoch AI copied that we don't read
 * ourselves. 'claim' is the claims Epoch AI collected, a last resort when a benchmark has nothing else.
 */
export type BoardSource = 'leaderboard' | 'epoch' | 'collected' | 'card' | 'claim';

export interface BenchSummary {
  b: Benchmark;
  area: string;
  /** Launch posts that list it: the headline results labs chose to show. */
  cites: { card: Card; score: number | null; asWritten?: string }[];
  /** System cards, model cards and technical reports that report it. */
  docCites: { card: Card; score: number | null; asWritten?: string; section?: string }[];
  /** Labs whose system cards report it. */
  docLabs: string[];
  labs: string[];
  first?: string;
  last?: string;
  status: Status;
  why?: 'saturated' | 'replaced' | 'other';
  /** Best score so far over time, from cards and Epoch combined (percent benchmarks only). */
  frontier: FrontierPoint[];
  leaderboardBoard: Score[];
  /** Epoch AI's own runs, best per model. */
  epochBoard: Score[];
  /** Copies of other leaderboards in Epoch AI's data, from boards we don't read ourselves: independent runs. */
  viaBoard: Score[];
  cardBoard: Score[];
  /** Claims Epoch AI collected: lab reports, papers and unnamed sources. Shown only with claimed scores included. */
  claimBoard: Score[];
  /** The board pages lead with: the official leaderboard's, then Epoch's, when either covers five or more models. */
  board: Score[];
  boardSource: BoardSource | null;
  /** Entries on the official leaderboard that are not in the model list, best per name. Shown, never credited. */
  unlisted: Score[];
  /** Agents and products built around models we track, and blends, best per entry. Shown, never credited. */
  systems: Score[];
  /**
   * The official board with only the runs in the board's own harness, best per model: no maker's agents. Set on a
   * board of agent entries where a maker's agent holds some model's best score, and some model ran in the board's
   * harness.
   */
  sameHarness?: Score[];
  /**
   * What the benchmark page's board draws: `board`, plus the unlisted entries when it is the official leaderboard,
   * or the unlisted entries alone when no other source has a score.
   */
  shown: Score[];
  shownSource: BoardSource | null;
  best?: Score;
  saturatedAt?: string;
  /** The date the best score first reached NEAR_CEILING, when some tests take a long time to close out. */
  nearCeilingAt?: string;
  nScores: number;
  /** The newest score from any source: when a model was last added. An old date means the board has gone quiet. */
  lastAdded?: { date: string; model: string; source: Score['source'] };
  /** When the almanac last read this benchmark's scores: its leaderboard, Epoch AI, or the newest model card. */
  refreshed?: string;
}

export const SATURATED = 85;
export const NEAR_CEILING = 95;

const summaries = new Map<string, BenchSummary>();

export function benchSummary(id: string): BenchSummary {
  const hit = summaries.get(id);
  if (hit) return hit;
  const b = benchById.get(id);
  if (!b) throw new Error(`unknown benchmark ${id}`);

  const cites = (citesByBench.get(id) ?? []).map(({ card, result }) => ({
    card,
    score: result.score,
    asWritten: result.as_written,
  }));
  const docCites = (docCitesByBench.get(id) ?? []).map(({ card, result }) => ({
    card,
    score: result.score,
    asWritten: result.as_written,
    section: result.section,
  }));
  const labOrder = [...new Set(cites.map((c) => c.card.lab))];
  const first = cites[0]?.card.date;
  const last = cites.at(-1)?.card.date;

  const leaderboardBoard = bestPerModel(lbByBench.get(id) ?? [], b);
  const epochBoard = bestPerModel(epochByBench.get(id) ?? [], b);
  const viaBoard = bestPerModel(viaByBench.get(id) ?? [], b);
  const cardBoard = bestPerModel(cardScoresByBench.get(id) ?? [], b);
  const claimBoard = bestPerModel(claimsByBench.get(id) ?? [], b);
  // An independent board leads, unless it stopped six or more months before the newest score from another
  // source. A board that ends at o4-mini should not headline a benchmark labs still report today. Independent
  // sources come in this order: the benchmark's own leaderboard, Epoch AI's runs, then a board Epoch AI copied.
  // the official board's entries include its agent systems: a board of agent submissions (GAIA) still leads with
  // its own leaderboard, though few of its entries are a model on its own
  const systems = bestPerModel(sysByBench.get(id) ?? [], b);
  const officialEntries = [...leaderboardBoard, ...systems];
  const newest = (xs: Score[]) => xs.reduce((m, x) => (x.date && x.date > m ? x.date : m), '');
  const latest = [officialEntries, epochBoard, viaBoard, cardBoard].map(newest).reduce((a, x) => (x > a ? x : a), '');
  const fresh = (xs: Score[]) => !latest || !newest(xs) || monthsBetween(newest(xs), latest) < 6;
  const [nL, nE, nV, nC] = [officialEntries.length, epochBoard.length, viaBoard.length, cardBoard.length];
  const boardSource: BenchSummary['boardSource'] =
    (nL >= 5 && fresh(officialEntries)) || (nL > 0 && nE < 5 && nV < 5 && nC === 0)
      ? 'leaderboard'
      : (nE >= 5 && fresh(epochBoard)) || (nE > 0 && nV < 5 && nC === 0)
        ? 'epoch'
        : (nV >= 5 && fresh(viaBoard)) || (nV > 0 && nC === 0)
          ? 'collected'
          : nC >= 5 || (nC > 0 && nL < 5 && nE < 5 && nV < 5)
            ? 'card'
            : nL >= 5
              ? 'leaderboard'
              : nE
                ? 'epoch'
                : nV
                  ? 'collected'
                  : nC
                    ? 'card'
                    : claimBoard.length
                      ? 'claim'
                      : null;
  const board = boardOf(boardSource, { leaderboardBoard, epochBoard, viaBoard, cardBoard, claimBoard });
  const unlisted = bestPerModel(unlistedByBench.get(id) ?? [], b);
  const own = (x: Score) => entryKind(x.benchmark, x.model, x.harness, x.info) === 'model';
  const sameBoard = boardSource === 'leaderboard' && board.some((x) => !own(x)) ? bestPerModel((lbByBench.get(id) ?? []).filter(own), b) : [];
  const sameHarness = sameBoard.length ? sameBoard : undefined;
  const shownSource = boardSource ?? (unlisted.length || systems.length ? 'leaderboard' : null);
  const shown = shownSource === 'leaderboard' && (unlisted.length || systems.length) ? bestPerModel([...board, ...systems, ...unlisted], b) : board;

  // frontier: only for percent scores, where card and Epoch numbers share a scale
  const pct = (b.unit ?? '%') === '%';
  const points: FrontierPoint[] = [];
  if (pct) {
    for (const s of lbByBench.get(id) ?? []) if (s.date) points.push({ date: s.date, value: s.value, model: s.model, source: 'leaderboard' });
    for (const s of epochByBench.get(id) ?? []) if (s.date) points.push({ date: s.date, value: s.value, model: s.model, source: 'epoch' });
    for (const s of viaByBench.get(id) ?? []) if (s.date) points.push({ date: s.date, value: s.value, model: s.model, source: 'collected', via: s.via, from: s.from });
    for (const s of cardScoresByBench.get(id) ?? [])
      if (s.unit === '%' && s.value > 0 && s.value <= 100 && s.date) points.push({ date: s.date, value: s.value, model: s.model, source: 'card' });
    // after the cards, so a lab's own card wins a tie with Epoch AI's copy of the same claim
    for (const s of claimsByBench.get(id) ?? []) if (s.date) points.push({ date: s.date, value: s.value, model: s.model, source: 'collected', via: s.via, from: s.from });
  }
  points.sort((x, y) => x.date.localeCompare(y.date) || y.value - x.value);
  const frontier: FrontierPoint[] = [];
  const sign = better(b);
  for (const p of points) {
    const top = frontier.at(-1);
    if (!top || sign * p.value > sign * top.value) frontier.push(p);
  }

  // status follows launch posts: what goes in and out of the headline results
  let status: Status = docCites.length ? 'system cards' : 'not in cards';
  let why: BenchSummary['why'];
  if (first && last) {
    const recent = cites.filter((c) => monthsBetween(c.card.date, AS_OF) < 6).length;
    status = recent >= 2 || monthsBetween(first, AS_OF) < 6 ? 'in use' : monthsBetween(last, AS_OF) < 12 ? 'fading' : 'dropped';
  }
  const atLast = last ? frontier.filter((p) => p.date <= last).at(-1)?.value : undefined;
  const saturatedAt = b.better !== 'lower' ? frontier.find((p) => p.value >= SATURATED)?.date : undefined;
  const nearCeilingAt = b.better !== 'lower' ? frontier.find((p) => p.value >= NEAR_CEILING)?.date : undefined;
  if (status === 'fading' || status === 'dropped') {
    const succ = b.successor ? citesByBench.get(b.successor)?.[0]?.card.date : undefined;
    if (atLast !== undefined && atLast >= SATURATED) why = 'saturated';
    else if (succ && last && monthsBetween(last, succ) <= 7) why = 'replaced';
    else why = 'other';
  }

  let lastAdded: BenchSummary['lastAdded'];
  for (const x of [...(lbByBench.get(id) ?? []), ...(epochByBench.get(id) ?? []), ...(viaByBench.get(id) ?? []), ...(claimsByBench.get(id) ?? []), ...(cardScoresByBench.get(id) ?? [])])
    if (x.date && x.date <= AS_OF && (!lastAdded || x.date > lastAdded.date)) lastAdded = { date: x.date, model: x.model, source: x.source };
  for (const c of [...cites, ...docCites]) if (!lastAdded || c.card.date > lastAdded.date) lastAdded = { date: c.card.date, model: c.card.model, source: 'card' };
  const refreshed = [
    ...(lbByBench.get(id)?.length && LEADERBOARDS[id]?.retrieved ? [LEADERBOARDS[id].retrieved] : []),
    ...(epochByBench.get(id)?.length || viaByBench.get(id)?.length || claimsByBench.get(id)?.length ? [epoch.retrieved] : []),
  ].sort().at(-1);

  const s: BenchSummary = {
    b,
    area: areaOf(b.category),
    cites,
    docCites,
    docLabs: [...new Set(docCites.map((c) => c.card.lab))],
    labs: labOrder,
    first,
    last,
    status,
    why,
    frontier,
    leaderboardBoard,
    epochBoard,
    viaBoard,
    cardBoard,
    claimBoard,
    board,
    boardSource,
    unlisted,
    systems,
    ...(sameHarness ? { sameHarness } : {}),
    shown,
    shownSource,
    best: board[0],
    saturatedAt,
    nearCeilingAt,
    nScores: new Set([...leaderboardBoard, ...epochBoard, ...viaBoard, ...cardBoard, ...claimBoard].map((x) => x.model)).size,
    lastAdded,
    refreshed,
  };
  summaries.set(id, s);
  return s;
}

export const allSummaries = () => benchmarks.map((b) => benchSummary(b.id));

/** The table filter for how recently a model got a score: every window it falls in, "quiet" after a year, "none" with no scores. */
export function addedWindows(s: BenchSummary): string {
  if (!s.lastAdded) return 'none';
  const m = monthsBetween(s.lastAdded.date, AS_OF);
  return m < 3 ? '3m 6m 12m' : m < 6 ? '6m 12m' : m < 12 ? '12m' : 'quiet';
}
/** The options for that filter, with counts over the given rows. */
export function addedOptions(rows: BenchSummary[]) {
  const n = (w: string) => rows.filter((s) => addedWindows(s).split(' ').includes(w)).length;
  return [
    { value: '', label: 'Last model: any time' },
    { value: '3m', label: 'New model within 3 months', count: n('3m') },
    { value: '6m', label: 'New model within 6 months', count: n('6m') },
    { value: '12m', label: 'New model within a year', count: n('12m') },
    { value: 'quiet', label: 'Quiet for a year or more', count: n('quiet') },
    { value: 'none', label: 'No scores yet', count: n('none') },
  ].filter((o) => o.value === '' || o.count);
}

// ---- model summaries ------------------------------------------------------------------------------
export interface ModelResult {
  benchmark: Benchmark;
  score: Score;
  /** The model's place on the board its score comes from, or 0 when the score is a lab's own number on a benchmark that independent runs also score: a claim never ranks against those. */
  rank: number;
  of: number;
  /** 'claims': ranked among labs' own numbers, the only scores the benchmark has. 'none': a lab's own number, not ranked. */
  among?: 'claims' | 'none';
}

export interface ModelSummary {
  m: Model;
  lab?: Lab;
  eci?: { eci: number; low: number | null; high: number | null };
  eciRank?: number;
  cards: Card[];
  results: ModelResult[];
}

const eciOrder = [...eciByModel.entries()].sort((a, b) => b[1].eci - a[1].eci).map(([id]) => id);
const modelSummaries = new Map<string, ModelSummary>();

export function modelSummary(id: string): ModelSummary {
  const hit = modelSummaries.get(id);
  if (hit) return hit;
  const m = modelById.get(id);
  if (!m) throw new Error(`unknown model ${id}`);
  const results: ModelResult[] = [];
  for (const b of benchmarks) {
    const s = benchSummary(b.id);
    // a lab's own number ranks only where labs' numbers are all the benchmark has. Where independent runs exist and
    // haven't scored this model, its lab's number shows unranked, so a claim never reads as first place.
    const independent = s.leaderboardBoard.length + s.epochBoard.length + s.viaBoard.length > 0;
    for (const board of [s.board, s.leaderboardBoard, s.epochBoard, s.viaBoard, s.cardBoard, s.claimBoard]) {
      if (!board.length) continue;
      const i = board.findIndex((x) => x.model === id);
      if (i < 0) continue;
      const claim = isClaim(board[i]);
      if (claim && independent) results.push({ benchmark: b, score: board[i], rank: 0, of: 0, among: 'none' });
      else results.push({ benchmark: b, score: board[i], rank: i + 1, of: board.length, ...(claim ? { among: 'claims' as const } : {}) });
      break;
    }
  }
  const eci = eciByModel.get(id);
  const out: ModelSummary = {
    m,
    lab: m.lab ? labById.get(m.lab) : undefined,
    eci,
    eciRank: eci ? eciOrder.indexOf(id) + 1 : undefined,
    cards: cards.filter((c) => c.model === id),
    results,
  };
  modelSummaries.set(id, out);
  return out;
}

/** Models worth a page: anything with a launch post, an ECI score, or scores on three or more benchmarks from any source. */
const benchesByModel = new Map<string, Set<string>>();
for (const s of [...epochScores, ...collectedScores, ...leaderboardScores, ...cardScores]) {
  let set = benchesByModel.get(s.model);
  if (!set) benchesByModel.set(s.model, (set = new Set()));
  set.add(s.benchmark);
}
const launched = new Set(cards.map((c) => c.model));
export const featuredModels = models.filter((m) => eciByModel.has(m.id) || launched.has(m.id) || (benchesByModel.get(m.id)?.size ?? 0) >= 3);
/** Labs with a page of their own: those with at least one model that has a page (see pages/labs/[id].astro). */
export const labPages = new Set(featuredModels.map((m) => m.lab).filter((l): l is string => !!l));

export { eciOrder };

// ---- headline benchmarks --------------------------------------------------------------------------
/** Benchmarks in the order a model card shows them: what labs headlined in the last year and is not yet
 * saturated comes first, then everything else by how many models have a score. */
export const benchPriority: string[] = benchmarks
  .map((b) => benchSummary(b.id))
  .filter((s) => (s.b.unit ?? '%') === '%' && s.board.length >= 5 && s.b.better !== 'lower')
  .map((s) => {
    const recent = s.cites.filter((c) => monthsBetween(c.card.date, AS_OF) < 12).length;
    const open = (s.best?.value ?? 0) < SATURATED ? 1 : 0;
    return { s, rank: open * 1000 + recent * 10 + Math.log10(s.board.length) };
  })
  .sort((a, b) => b.rank - a.rank)
  .map((x) => x.s.b.id);
const priorityIndex = new Map(benchPriority.map((id, i) => [id, i]));

export function headlineResults(id: string, n = 3): ModelResult[] {
  // only ranks from each benchmark's main board, so two cards never both claim first place
  return modelSummary(id)
    .results.filter((r) => priorityIndex.has(r.benchmark.id) && r.of >= 5 && r.score.source === benchSummary(r.benchmark.id).boardSource)
    .sort((a, b) => priorityIndex.get(a.benchmark.id)! - priorityIndex.get(b.benchmark.id)!)
    .slice(0, n);
}

export const eciValues = [...eciByModel.values()].map((e) => e.eci).sort((a, b) => a - b);
