// Real2Sim (Momentum Research Labs): coding agents turn a DROID robot recording into an interactive simulation.
// The board's data is the site's benchmark-data.js, which holds plain JSON arrays: SUMMARY (one entry per model and
// harness, with each axis's mean over 10 tasks) and TASK_GRID, TOKEN_USAGE and TOKEN_COST (one row per task, one
// column per model and harness). The board's headline, "Combined", is the mean over tasks of the four axes averaged
// with equal weights (scoring.js). This importer reads the arrays as JSON and never runs the site's code. It finds
// each SUMMARY entry's column by matching the per-axis means, so a reordered grid still lines up.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://www.real2sim.bot/';
const FEED = `${SITE}benchmark-data.js`;

interface Axis { mean: number | null; n: number }
interface Summary { m: string; h: string; task_count: number; axes: Record<string, Axis> }
const AXES = ['visual_fidelity', 'semantic_fidelity_dinov2', 'open_loop', 'closed_loop'];

/** The JSON array assigned to `const NAME = [...];` on one line of the file. */
function array<T>(js: string, name: string): T {
  const m = js.match(new RegExp(`^const ${name} = (\\[.*\\]);\\s*$`, 'm'));
  if (!m) throw new Error(`Real2Sim data has no ${name} array`);
  return JSON.parse(m[1]) as T;
}

/** id -> display name from an object list such as `{ id: 'opus55', name: 'Claude Opus 5.5', ... }`. */
function names(js: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of js.matchAll(/\{\s*id:\s*'([\w-]+)',\s*name:\s*'([^']+)'/g)) out.set(m[1], m[2]);
  return out;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

const board: Leaderboard = {
  benchmark: 'real2sim',
  url: `${SITE}#leaderboard`,
  feed: FEED,
  terms: 'The site states no terms of use and its robots.txt allows all agents. The DROID recordings keep their own license.',
  async fetch() {
    const js = await fetchText(FEED);
    const summary = array<Summary[]>(js, 'SUMMARY');
    const grid = array<[string, number, number[][]][]>(js, 'TASK_GRID');
    const usage = array<[string, [number, number][]][]>(js, 'TOKEN_USAGE');
    const cost = array<[string, number[]][]>(js, 'TOKEN_COST');
    const label = names(js);
    const columns = grid[0]?.[2].length ?? 0;
    const out: LeaderboardRow[] = [];
    for (const s of summary) {
      const model = label.get(s.m);
      const harness = label.get(s.h);
      if (!model || !harness) throw new Error(`Real2Sim: no name for ${s.m} or ${s.h}`);
      // the grid column whose task values average to this entry's visual and semantic means
      const col = [...Array(columns).keys()].find((c) =>
        AXES.slice(0, 2).every((a, i) => Math.abs(mean(grid.map((t) => t[2][c][i])) - (s.axes[a]?.mean ?? NaN)) < 0.0015),
      );
      if (col === undefined) throw new Error(`Real2Sim: no task column matches ${s.m}/${s.h}`);
      const metrics: Record<string, number> = {};
      for (const [a, key] of [
        ['visual_fidelity', 'visual'],
        ['semantic_fidelity_dinov2', 'semantic'],
        ['open_loop', 'replay'],
        ['closed_loop', 'policy'],
      ] as const) {
        const v = s.axes[a]?.mean;
        if (v != null) metrics[key] = a === 'open_loop' || a === 'closed_loop' ? round(v * 100, 1) : v;
      }
      out.push({
        model,
        harness,
        score: round(mean(grid.map((t) => mean(t[2][col]))), 3),
        cost: round(mean(cost.map((t) => t[1][col])), 2),
        tokens: Math.round(mean(usage.map((t) => t[1][col][0]))),
        metrics,
      });
    }
    if (out.length < 6) throw new Error(`Real2Sim board has ${out.length} rows`);
    return out;
  },
};
export default board;
