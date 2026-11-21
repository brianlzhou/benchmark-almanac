// RTLScout ranks complete suite-v2 configurations by mean rank across five circuit designs.
// Read the overall dataset in the page's data.js without executing the downloaded script.
import type { Leaderboard } from './types.ts';
import { jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://plex1.github.io/rtlscout-bench/";
const feed = "https://plex1.github.io/rtlscout-bench/data.js";
type Run = { complete: boolean, name: string, label: string, reasoning_effort: string, mean_rank: number,
  open_weights: boolean, reduction_pct: number, score: number, frozen_score: number, usd_total: number, runtime_total: number,
  cells: Record<string, {rank: number, pct: number, n: number}> };
const board: Leaderboard = {
  benchmark: 'rtlscout-bench-2', url, feed,
  terms: "Felix Arnold publishes RTL Scout leaderboard data under CC BY 4.0. The GitHub Pages host provides no applicable robots rules.",
  parts: {},
  async fetch() {
    const d = jsonAfter<{suite: string, overall: {tasks: {task: string, title: string}[], rows: Run[], n_complete: number}}>(await fetchText(feed), 'window.RTLSCOUT_DATA =');
    const { tasks, rows, n_complete } = d.overall;
    const complete = rows.filter(r => r.complete);
    if (d.suite !== 'suite-v2' || tasks.length !== 5 || complete.length !== n_complete || n_complete < 12) throw new Error('Incomplete RTLScout suite');
    for (const t of tasks) board.parts![t.task] = { name: t.title, better: 'lower', note: 'Rank on this circuit design.' };
    return complete.map(r => {
      if (!r.name || !Number.isFinite(r.mean_rank)) throw new Error('Invalid RTLScout entry');
      const metrics: Record<string, number> = { reduction: r.reduction_pct, headroom: r.score * 100,
        frozenHeadroom: r.frozen_score * 100, runtime: r.runtime_total / tasks.length };
      for (const {task} of tasks) {
        const c = r.cells[task];
        if (!Number.isFinite(c?.rank)) throw new Error('Missing design rank: ' + task);
        metrics[task] = c.rank;
        metrics[task + 'Reduction'] = -c.pct;
        metrics[task + 'Trials'] = c.n;
      }
      const trials = new Set(Object.values(r.cells).map(c => c.n));
      return { model: r.name, setting: r.label.match(/\(([^)]+)\)$/)?.[1] ?? r.reasoning_effort, score: r.mean_rank,
        open: r.open_weights, cost: r.usd_total / tasks.length, trials: trials.size === 1 ? [...trials][0] : undefined, metrics };
    });
  },
};
export default board;
