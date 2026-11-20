// A benchmark's parts: the scores a board gives on one slice of the test, such as a subject, a language, a
// difficulty level or a user group. The board's importer names them (`parts` in scripts/leaderboards/types.ts), and
// each row keeps its part scores in `metrics` under those keys. The benchmark page ranks models on each part in the
// same switch as Arena's categories (src/components/ArenaCategories.astro).
import { LEADERBOARDS, leaderboardScores, benchById } from './data.ts';
import type { Score } from './types.ts';
import type { CatView } from './arena-categories.ts';

export interface PartView extends CatView {
  /** One sentence on what the part holds, from the importer. */
  note?: string;
  /** The part's unit, when it isn't the benchmark's. */
  unit?: string;
  better: 'higher' | 'lower';
  /** A part of the test, or another of the benchmark's measures on the whole test (Benchmark.measures). */
  kind: 'part' | 'measure';
}

/** The group a board's measure columns go under in the switch. */
export const MEASURE_GROUP = 'Other measures';

/** Every part a board scores for a benchmark, grouped as the importer lists them. A part needs three scored models, and a board two such parts. */
export function boardParts(id: string, better: 'higher' | 'lower' = 'higher'): PartView[] {
  const parts = LEADERBOARDS[id]?.parts ?? {};
  const cols = LEADERBOARDS[id]?.measures ?? {};
  if (!Object.keys(parts).length && !Object.keys(cols).length) return [];
  const rows = leaderboardScores.filter((x) => x.benchmark === id && x.metrics);
  const groups = [...new Set(Object.values(parts).map((p) => p.group ?? ''))];
  const views: PartView[] = [];
  for (const [key, p] of Object.entries(parts)) {
    const dir = p.better ?? better;
    // each model's best score on the part, across its runs, as the overall board keeps each model's best run
    const best = new Map<string, Score>();
    for (const x of rows) {
      const v = x.metrics![key];
      if (!Number.isFinite(v)) continue;
      const had = best.get(x.model);
      if (!had || (dir === 'lower' ? v < had.value : v > had.value)) best.set(x.model, { ...x, value: v });
    }
    if (best.size < 3) continue;
    const board = [...best.values()].sort((a, b) => (dir === 'lower' ? a.value - b.value : b.value - a.value));
    views.push({ key, name: p.name, group: p.group ?? '', note: p.note, unit: p.unit, better: dir, board, kind: 'part' });
  }
  // the board's columns for the benchmark's other measures, such as a partial-credit score beside a pass rate
  const measures = benchById.get(id)?.measures ?? [];
  for (const [key, mid] of Object.entries(cols)) {
    const m = measures.find((x) => x.id === mid);
    if (!m || key in parts) continue;
    const dir = m.better ?? better;
    const best = new Map<string, Score>();
    for (const x of rows) {
      const v = x.metrics![key];
      if (!Number.isFinite(v)) continue;
      const had = best.get(x.model);
      if (!had || (dir === 'lower' ? v < had.value : v > had.value)) best.set(x.model, { ...x, value: v });
    }
    if (best.size < 3) continue;
    const board = [...best.values()].sort((a, b) => (dir === 'lower' ? a.value - b.value : b.value - a.value));
    views.push({ key, name: m.name, group: MEASURE_GROUP, note: m.note, unit: m.unit, better: dir, board, kind: 'measure' });
  }
  // one part alone, often just another split of the data (a dev set, a validation set), makes no switch, but one
  // other measure does
  const nParts = views.filter((v) => v.kind === 'part').length;
  const shown = nParts >= 2 ? views : views.filter((v) => v.kind === 'measure');
  const order = [...groups, MEASURE_GROUP];
  return shown.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}

/** How many boards score parts, and how many parts they score in all: for the methods and coverage pages. */
export function partCoverage(): { boards: number; parts: number } {
  const withParts = Object.values(LEADERBOARDS).filter((x) => x.parts && Object.keys(x.parts).length);
  return { boards: withParts.length, parts: withParts.reduce((n, x) => n + Object.keys(x.parts!).length, 0) };
}
