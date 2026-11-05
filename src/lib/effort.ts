// Effort levels and cost on one leaderboard. Many boards run each model at several reasoning efforts
// (low, medium, high, xhigh, max), and some report the cost of each run. The main board keeps each
// model's best run; this module keeps every run, grouped into one series per model and harness.
import type { Score } from './types.ts';
import { leaderboardScores, benchById, modelById, LEADERBOARDS } from './data.ts';

export interface Run {
  model: string;
  harness: string | null;
  setting: string | null;
  value: number;
  cost: number | null;
  tokens: number | null;
}

export interface Series {
  key: string;
  model: string;
  lab?: string;
  harness: string | null;
  /** Lowest effort first. Ordered by cost when every run has one. */
  runs: Run[];
}

export interface EffortView {
  mode: 'cost' | 'ladder';
  /** What a cost covers: one task, or the whole run of the test set (ARC-AGI-3). */
  costPer: 'task' | 'run';
  unit: string;
  series: Series[];
  /** The runs the chart draws: in cost mode, those with a cost. */
  runs: Run[];
  /** Every run on the board, for the table. */
  all: Run[];
  /** Cost mode: the runs no other run beats on both score and cost, cheapest first. */
  frontier: Run[];
  /** Cost mode: the best run, and the cheapest run within `near` points of it. */
  top?: Run;
  cheap?: Run;
  near: number;
  /** Ladder mode: median points gained from the lowest to the highest effort. */
  gain?: number;
}

const LEVELS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

/** Sort key for a setting: named effort first, then a thinking budget such as "32k". Unknown is -1. */
export function effortRank(setting: string | null | undefined): number {
  const s = (setting ?? '').toLowerCase();
  const word = s.match(/\b(xhigh|max|high|medium|low|minimal|none)\b/);
  const budget = s.match(/\b(\d+(?:\.\d+)?)\s*k\b/);
  if (!word && !budget) return -1;
  return (word ? LEVELS.indexOf(word[1]) + 1 : 0) * 1e6 + (budget ? Number(budget[1]) : 0);
}

const clean = (v: string | null | undefined) => (v && v !== 'unknown' ? v : null);

export function effortView(benchmark: string): EffortView | null {
  const b = benchById.get(benchmark);
  if (!b) return null;
  const unit = b.unit ?? '%';
  const sign = b.better === 'lower' ? -1 : 1;
  const runs: Run[] = leaderboardScores
    .filter((s: Score) => s.benchmark === benchmark && s.unit === unit)
    .map((s) => ({ model: s.model, harness: clean(s.harness), setting: clean(s.setting), value: s.value, cost: s.cost ?? null, tokens: s.tokens ?? null }));
  if (!runs.length) return null;

  const groups = new Map<string, Run[]>();
  for (const r of runs) {
    const k = `${r.model}|${r.harness ?? ''}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const costed = runs.filter((r) => r.cost !== null && r.cost > 0);
  const costModels = new Set(costed.map((r) => r.model));
  const mode: EffortView['mode'] | null =
    costed.length >= 8 && costModels.size >= 4 && sign === 1
      ? 'cost'
      : [...groups.values()].filter((g) => new Set(g.map((r) => r.setting)).size >= 2).length >= 3
        ? 'ladder'
        : null;
  if (!mode) return null;

  const series: Series[] = [...groups.entries()].map(([key, rs]) => {
    const ordered =
      mode === 'cost'
        ? rs.filter((r) => r.cost !== null && r.cost > 0).sort((a, c) => a.cost! - c.cost!)
        : [...rs].sort((a, c) => effortRank(a.setting) - effortRank(c.setting) || a.value - c.value);
    return { key, model: rs[0].model, lab: modelById.get(rs[0].model)?.lab, harness: rs[0].harness, runs: ordered };
  });

  if (mode === 'cost') {
    // the frontier: walking from the cheapest run, keep each run that beats every cheaper one
    const frontier: Run[] = [];
    for (const r of [...costed].sort((a, c) => a.cost! - c.cost! || c.value - a.value)) {
      if (!frontier.length || r.value > frontier.at(-1)!.value) frontier.push(r);
    }
    const top = frontier.at(-1)!;
    const near = unit === '%' ? 5 : Math.abs(top.value) * 0.05;
    const cheap = costed.filter((r) => r.value >= top.value - near).sort((a, c) => a.cost! - c.cost!)[0];
    return {
      mode,
      costPer: LEADERBOARDS[benchmark]?.costPer ?? 'task',
      unit,
      series: series.filter((s) => s.runs.length),
      runs: costed,
      all: runs,
      frontier,
      top,
      cheap: cheap && cheap !== top && cheap.cost! * 2 <= top.cost! ? cheap : undefined,
      near,
    };
  }

  // ladder: models run at two or more efforts, best first
  const multi = series
    .filter((s) => new Set(s.runs.map((r) => r.setting)).size >= 2)
    .sort((a, c) => sign * (Math.max(...c.runs.map((r) => sign * r.value)) - Math.max(...a.runs.map((r) => sign * r.value))));
  const gains = multi
    .filter((s) => s.runs.every((r) => effortRank(r.setting) >= 0))
    .map((s) => sign * (s.runs.at(-1)!.value - s.runs[0].value))
    .sort((a, c) => a - c);
  const gain = gains.length ? gains[Math.floor(gains.length / 2)] : undefined;
  return { mode, costPer: LEADERBOARDS[benchmark]?.costPer ?? 'task', unit, series: multi, runs, all: runs, frontier: [], near: 0, gain };
}

/** How a page says what one cost covers: "a task", or "for the full run" when the board prices whole runs. */
export const costUnit = (per: 'task' | 'run') => (per === 'run' ? 'for the full run' : 'a task');

/** "$0.44", "$4.43", "$17", "$1,240" */
export function usd(v: number): string {
  if (v >= 100) return `$${Math.round(v).toLocaleString('en-US')}`;
  if (v >= 10) return `$${v.toFixed(0)}`;
  if (v >= 0.01) return `$${v.toFixed(2)}`;
  return `$${v.toPrecision(1)}`;
}

/** "28.5K", "1.46M" */
export function tokenCount(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
}
