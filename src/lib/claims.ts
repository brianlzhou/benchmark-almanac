// Lab claims next to leaderboards: each score a lab reported for its own model, beside the score the same model
// has on the benchmark's own leaderboard, or from Epoch AI's own runs when the board has none. The best of each
// side is compared, as the site ranks every model at its best setting. Most gaps come from setup, and the pages
// say so: a different harness, effort level, number of attempts or task subset.

import { cards, systemCards, benchById, leaderboardScores, epochScores, bestPerModel, normUnit, modelById } from './data.ts';
import type { Card, Score } from './types.ts';
import { score as fmt } from './format.ts';
import notesJson from '../../data/claim-notes.json';

export interface ClaimPair {
  model: string;
  benchmark: string;
  unit: string;
  /** The lab's best number for the model, the document it came from, and the result as the document labels it. */
  claim: { value: number; card: Card; asWritten?: string };
  /** The board's best row for the model: the leaderboard's own, or Epoch AI's run. */
  board: Score;
  /** Lab minus board, signed so a positive gap means the lab's number is better (for lower-is-better tests too). */
  gap: number;
  /** The two numbers agree to rounding, which usually means one side copied the other. */
  same: boolean;
}

/** Numbers this close count as the same: a board that lists 62.38 for a lab's 62.4. */
export const SAME_WITHIN = 0.15;

const relGap = (p: { gap: number; claim: { value: number }; board: { value: number }; unit: string }) =>
  p.unit === '%' ? Math.abs(p.gap) / 100 : Math.abs(p.gap) / Math.max(Math.abs(p.claim.value), Math.abs(p.board.value), 1e-9);
const sign = (id: string) => (benchById.get(id)?.better === 'lower' ? -1 : 1);

// the lab's best number per model and benchmark, in the benchmark's own unit
const claims = new Map<string, ClaimPair['claim']>();
for (const card of [...cards, ...systemCards]) {
  for (const r of card.results) {
    const b = benchById.get(r.benchmark);
    if (!b || r.score === null) continue;
    const unit = b.unit ?? '%';
    if (normUnit(r.unit) !== unit) continue;
    if (unit === '%' && (r.score < 0 || r.score > 100)) continue;
    const k = `${card.model}|${r.benchmark}`;
    const cur = claims.get(k);
    if (!cur || sign(r.benchmark) * r.score > sign(r.benchmark) * cur.value) claims.set(k, { value: r.score, card, asWritten: r.as_written });
  }
}

// the boards: the official leaderboard first, then Epoch AI where Epoch runs the benchmark itself. Epoch rows
// it collected from elsewhere are often the lab's own number, so they are no check on it.
const group = (xs: Score[]) => {
  const m = new Map<string, Score[]>();
  for (const s of xs) m.set(s.benchmark, [...(m.get(s.benchmark) ?? []), s]);
  return m;
};
const boardRows = group(leaderboardScores);
const epochRows = group(epochScores.filter((s) => benchById.get(s.benchmark)?.epoch?.runs === 'epoch'));
const bestRow = new Map<string, Score>();
for (const [id, rows] of [...epochRows, ...boardRows]) {
  const b = benchById.get(id)!;
  for (const s of bestPerModel(rows, b)) bestRow.set(`${s.model}|${id}`, s);
}

export const claimPairs: ClaimPair[] = [...claims.entries()]
  .flatMap(([k, claim]) => {
    const board = bestRow.get(k);
    if (!board) return [];
    const [model, benchmark] = k.split('|');
    const gap = sign(benchmark) * (claim.value - board.value);
    const unit = benchById.get(benchmark)?.unit ?? '%';
    // dollars and ratings are often printed whole, so a board's $16,484.21 matches a lab's $16,484
    const within = unit === 'usd' || unit === 'elo' || unit === 'rating' ? 0.5 : SAME_WITHIN;
    return [{ model, benchmark, unit, claim, board, gap, same: Math.abs(gap) <= within }];
  })
  // largest gaps first, measured against the larger number, so dollars and ratings sort beside percentages
  .sort((a, b) => relGap(b) - relGap(a) || a.benchmark.localeCompare(b.benchmark));

const byBench = new Map<string, ClaimPair[]>();
const byModel = new Map<string, ClaimPair[]>();
for (const p of claimPairs) {
  byBench.set(p.benchmark, [...(byBench.get(p.benchmark) ?? []), p]);
  byModel.set(p.model, [...(byModel.get(p.model) ?? []), p]);
}
export const claimsForBenchmark = (id: string) => byBench.get(id) ?? [];
export const claimsForModel = (id: string) => byModel.get(id) ?? [];

export const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Counts over a set of pairs in percent: how many agree, and how the rest split. */
export function claimStats(pairs: ClaimPair[]) {
  const pct = pairs.filter((p) => p.unit === '%');
  const differ = pct.filter((p) => !p.same);
  return {
    pairs: pairs.length,
    pct: pct.length,
    same: pct.filter((p) => p.same).length,
    labHigher: differ.filter((p) => p.gap > 0).length,
    labLower: differ.filter((p) => p.gap < 0).length,
    /** The median gap among pairs that differ, in percentage points. */
    medianGap: median(differ.map((p) => p.gap)),
    benchmarks: new Set(pairs.map((p) => p.benchmark)).size,
    models: new Set(pairs.map((p) => p.model)).size,
  };
}

/** Pairs grouped by a key (a benchmark or a lab), with their stats, largest groups first. */
export function claimGroups(key: (p: ClaimPair) => string | undefined, min = 3) {
  const m = new Map<string, ClaimPair[]>();
  for (const p of claimPairs) {
    const k = key(p);
    if (k) m.set(k, [...(m.get(k) ?? []), p]);
  }
  return [...m.entries()]
    .map(([k, ps]) => ({ key: k, pairs: ps, stats: claimStats(ps) }))
    .filter((g) => g.stats.pct >= min)
    .sort((a, b) => b.stats.pct - a.stats.pct || a.key.localeCompare(b.key));
}

export const labOfPair = (p: ClaimPair) => modelById.get(p.model)?.lab;

/** Why a lab's number and a board's differ, where we checked (data/claim-notes.json). */
export interface ClaimNote {
  model: string;
  benchmark: string;
  /** setup: both right, the runs differ. metric: the lab reports another metric. */
  cause: 'setup' | 'metric';
  reason: string;
  evidence: string[];
}
const notes = new Map((notesJson as ClaimNote[]).map((n) => [`${n.model}|${n.benchmark}`, n]));
export const claimNote = (p: ClaimPair) => notes.get(`${p.model}|${p.benchmark}`);

/** The gap as a table shows it: "+4.4 pts", "\u22123 pts", "+23" for a rating, or "Same". */
export function gapText(p: ClaimPair): string {
  if (p.same) return 'Same';
  const v = Math.abs(p.gap);
  const n = p.unit === '%' ? `${v < 10 ? v.toFixed(1) : Math.round(v)} pts` : fmt(v, p.unit);
  return `${p.gap > 0 ? '+' : '\u2212'}${n}`;
}
