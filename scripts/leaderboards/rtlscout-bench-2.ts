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
  parts: {
    'tpu-adp': { name: 'logikbench tpu', better: 'lower', note: 'Rank on this circuit design.' },
    'jpeg-adp': { name: 'core_jpeg 2-D IDCT', better: 'lower', note: 'Rank on this circuit design.' },
    'pdpu-adp': { name: 'PDPU posit dotp', better: 'lower', note: 'Rank on this circuit design.' },
    'fpmul-adp': { name: 'FP16 multiplier', better: 'lower', note: 'Rank on this circuit design.' },
    'alu-adp': { name: 'CV32E40P ALU', better: 'lower', note: 'Rank on this circuit design.' },
  },
  stats: {
    reduction: { name: 'Cell reduction', unit: '%', better: 'higher' }, headroom: { name: 'Headroom', unit: '%', better: 'higher' }, frozenHeadroom: { name: 'Frozen headroom', unit: '%', better: 'higher' }, runtime: { name: 'Runtime per design', unit: 'seconds', better: 'lower' },
    'tpu-adpReduction': { name: 'TPU cell reduction', unit: '%', better: 'higher' },
    'jpeg-adpReduction': { name: 'JPEG cell reduction', unit: '%', better: 'higher' },
    'pdpu-adpReduction': { name: 'PDPU cell reduction', unit: '%', better: 'higher' },
    'fpmul-adpReduction': { name: 'FPMUL cell reduction', unit: '%', better: 'higher' },
    'alu-adpReduction': { name: 'ALU cell reduction', unit: '%', better: 'higher' },
  },
  chart: {
    title: 'Result vs. cost',
    note: 'Headroom score across the five circuit designs against mean API cost per design, matching the Result vs. cost Pareto chart on RTLScout.',
    x: { key: 'cost', label: 'Mean API cost per design', unit: '$', better: 'lower' },
    y: { key: 'headroom', label: 'Headroom score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const d = jsonAfter<{suite: string, overall: {tasks: {task: string, title: string}[], rows: Run[], n_complete: number}}>(await fetchText(feed), 'window.RTLSCOUT_DATA =');
    const { tasks, rows, n_complete } = d.overall;
    const complete = rows.filter(r => r.complete);
    if (d.suite !== 'suite-v2' || tasks.length !== 5 || complete.length !== n_complete || n_complete < 12) throw new Error('Incomplete RTLScout suite');
    return complete.map(r => {
      if (!r.name || !Number.isFinite(r.mean_rank)) throw new Error('Invalid RTLScout entry');
      const metrics: Record<string, number> = { reduction: r.reduction_pct, headroom: r.score * 100,
        frozenHeadroom: r.frozen_score * 100, runtime: r.runtime_total / tasks.length };
      for (const {task} of tasks) {
        const c = r.cells[task];
        if (!Number.isFinite(c?.rank)) throw new Error('Missing design rank: ' + task);
        metrics[task] = c.rank;
        metrics[task + 'Reduction'] = -c.pct;
      }
      const trials = new Set(Object.values(r.cells).map(c => c.n));
      return { model: r.name, setting: r.label.match(/\(([^)]+)\)$/)?.[1] ?? r.reasoning_effort, score: r.mean_rank,
        open: r.open_weights, cost: r.usd_total / tasks.length, trials: trials.size === 1 ? [...trials][0] : undefined, metrics };
    });
  },
};
export default board;
