// Loads data/ once per build, checks every cross-reference, and derives the summaries pages use.
// A broken reference (a card naming a model that is not in models.json) fails the build.

import labsJson from '../../data/labs.json';
import modelsJson from '../../data/models.json';
import benchmarksJson from '../../data/benchmarks.json';
import resourcesJson from '../../data/resources.json';
import cardsJson from '../../data/cards.json';
import systemCardsJson from '../../data/system-cards.json';
import epochJson from '../../data/scores/epoch.json';
import leaderboardsJson from '../../data/scores/leaderboards.json';
import type { Benchmark, Card, Lab, Model, Resource, Score } from './types.ts';
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

type EpochRow = [string, string, string | null, string | null, number, string | null];
// leaderboard rows add cost (US dollars per task) and output tokens per task
type BoardRow = [...EpochRow, (number | null)?, (number | null)?];
const epoch = epochJson as unknown as {
  source: string;
  url: string;
  license: string;
  retrieved: string;
  rows: EpochRow[];
  eci: { model: string; eci: number | null; low: number | null; high: number | null }[];
};
export const EPOCH_SOURCE = { name: epoch.source, url: epoch.url, license: epoch.license, retrieved: epoch.retrieved };

type Board = { url: string; feed: string; terms: string; retrieved: string; rows: number; unmatched: string[] };
const lb = leaderboardsJson as unknown as { retrieved: string | null; boards: Record<string, Board>; rows: BoardRow[] };
/** Official leaderboards: the boards each benchmark's makers publish, read by scripts/sync-leaderboards.ts. */
export const LEADERBOARDS = lb.boards;

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

export const leaderboardScores: Score[] = lb.rows.map(([benchmark, model, setting, harness, value, date, cost, tokens]) => ({
  benchmark,
  model,
  value,
  unit: benchById.get(benchmark)?.unit ?? '%',
  setting,
  harness,
  date: date ?? modelById.get(model)?.released ?? null,
  cost: cost ?? null,
  tokens: tokens ?? null,
  source: 'leaderboard',
}));

export const epochScores: Score[] = epoch.rows.map(([benchmark, model, setting, harness, value, date]) => ({
  benchmark,
  model,
  value,
  unit: benchById.get(benchmark)?.unit ?? '%',
  setting,
  harness,
  date: date ?? modelById.get(model)?.released ?? null,
  source: 'epoch',
}));

/** Card scores in the benchmark's own unit. A score in another unit (an Elo beside percentages) is left out. */
export const cardScores: Score[] = [...cards, ...systemCards].flatMap((c) =>
  c.results
    .filter((r) => r.score !== null && normUnit(r.unit) === (benchById.get(r.benchmark)?.unit ?? '%'))
    .filter((r) => normUnit(r.unit) !== '%' || ((r.score as number) >= 0 && (r.score as number) <= 100))
    .map((r) => ({
      benchmark: r.benchmark,
      model: c.model,
      value: r.score as number,
      unit: normUnit(r.unit),
      setting: null,
      harness: null,
      date: c.date,
      source: 'card' as const,
      card: c.id,
    })),
);

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
const lbByBench = groupBy(leaderboardScores, (s) => s.benchmark);
const cardScoresByBench = groupBy(cardScores, (s) => s.benchmark);
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

/** Best score per model, best first. Settings and harnesses of one model compete; the best one stays. */
export function bestPerModel(scores: Score[], b: Benchmark): Score[] {
  const top = new Map<string, Score>();
  const sign = better(b);
  for (const s of scores) {
    const cur = top.get(s.model);
    if (!cur || sign * s.value > sign * cur.value) top.set(s.model, s);
  }
  return [...top.values()].sort((x, y) => sign * (y.value - x.value) || (x.date ?? '').localeCompare(y.date ?? ''));
}

// ---- benchmark summaries --------------------------------------------------------------------------
export type Status = 'in use' | 'fading' | 'dropped' | 'system cards' | 'not in cards';

export interface FrontierPoint {
  date: string;
  value: number;
  model: string;
  source: 'leaderboard' | 'epoch' | 'card';
}

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
  epochBoard: Score[];
  cardBoard: Score[];
  /** The board pages lead with: the official leaderboard's, then Epoch's, when either covers five or more models. */
  board: Score[];
  boardSource: 'leaderboard' | 'epoch' | 'card' | null;
  best?: Score;
  saturatedAt?: string;
  nScores: number;
}

export const SATURATED = 85;

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
  const cardBoard = bestPerModel(cardScoresByBench.get(id) ?? [], b);
  const boardSource: BenchSummary['boardSource'] =
    leaderboardBoard.length >= 5 || (leaderboardBoard.length > 0 && epochBoard.length < 5 && cardBoard.length === 0)
      ? 'leaderboard'
      : epochBoard.length >= 5 || (epochBoard.length > 0 && cardBoard.length === 0)
        ? 'epoch'
        : cardBoard.length
          ? 'card'
          : null;
  const board = boardSource === 'leaderboard' ? leaderboardBoard : boardSource === 'epoch' ? epochBoard : boardSource === 'card' ? cardBoard : [];

  // frontier: only for percent scores, where card and Epoch numbers share a scale
  const pct = (b.unit ?? '%') === '%';
  const points: FrontierPoint[] = [];
  if (pct) {
    for (const s of lbByBench.get(id) ?? []) if (s.date) points.push({ date: s.date, value: s.value, model: s.model, source: 'leaderboard' });
    for (const s of epochByBench.get(id) ?? []) if (s.date) points.push({ date: s.date, value: s.value, model: s.model, source: 'epoch' });
    for (const s of cardScoresByBench.get(id) ?? [])
      if (s.unit === '%' && s.value > 0 && s.value <= 100 && s.date) points.push({ date: s.date, value: s.value, model: s.model, source: 'card' });
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
  if (status === 'fading' || status === 'dropped') {
    const succ = b.successor ? citesByBench.get(b.successor)?.[0]?.card.date : undefined;
    if (atLast !== undefined && atLast >= SATURATED) why = 'saturated';
    else if (succ && last && monthsBetween(last, succ) <= 7) why = 'replaced';
    else why = 'other';
  }

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
    cardBoard,
    board,
    boardSource,
    best: board[0],
    saturatedAt,
    nScores: new Set([...leaderboardBoard, ...epochBoard, ...cardBoard].map((x) => x.model)).size,
  };
  summaries.set(id, s);
  return s;
}

export const allSummaries = () => benchmarks.map((b) => benchSummary(b.id));

// ---- model summaries ------------------------------------------------------------------------------
export interface ModelResult {
  benchmark: Benchmark;
  score: Score;
  rank: number;
  of: number;
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
    for (const board of [s.board, s.leaderboardBoard, s.epochBoard, s.cardBoard]) {
      if (!board.length) continue;
      const i = board.findIndex((x) => x.model === id);
      if (i >= 0) {
        results.push({ benchmark: b, score: board[i], rank: i + 1, of: board.length });
        break;
      }
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
for (const s of [...epochScores, ...leaderboardScores, ...cardScores]) {
  let set = benchesByModel.get(s.model);
  if (!set) benchesByModel.set(s.model, (set = new Set()));
  set.add(s.benchmark);
}
const launched = new Set(cards.map((c) => c.model));
export const featuredModels = models.filter((m) => eciByModel.has(m.id) || launched.has(m.id) || (benchesByModel.get(m.id)?.size ?? 0) >= 3);

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
