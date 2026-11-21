// RSI-Inference Bench ranks coding agents by a category-weighted Bradley-Terry rating on the Elo scale.
// Read Apple's joint leaderboard, task scores and run statistics embedded in its published HTML.
import type { Leaderboard, BoardPart } from './types.ts';
import { jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/apple-aiml-research/ml-rsi-inference-bench/main/docs/leaderboard.html';
interface Agent {
  name: string; rating: number; ms: number; opt: number; ms_lo: number; ms_hi: number; opt_lo: number; opt_hi: number;
  runs: { all: { n: number; cost?: {mean: number}; tok_out?: {mean: number}; hours?: {mean: number} } };
}
interface Task {
  id: string; title: string; track: string; engine: string; variant: string | null;
  results: { agent: string; pass_at_1?: number; speedup?: number }[];
}

const board: Leaderboard = {
  benchmark: 'rsi-inference-bench', url: 'https://rsi-inference.com', feed,
  terms: 'The repository uses the Apple Sample Code License. The leaderboard domain returns 404 for robots.txt.',
  stats: {
    steps: { name: 'Mean steps', unit: 'count', better: 'lower' },
    hours: { name: 'Mean run hours', unit: 'hours', better: 'lower' },
  },
  async fetch() {
    const html = (await fetchText(feed)).replace(/([:,\[])(-?)\.(\d)/g, (_, prefix, sign, digit) => prefix + sign + '0.' + digit);
    const { agents } = jsonAfter<{agents: Agent[]}>(html, 'window.OV=');
    const { tasks } = jsonAfter<{tasks: Task[]}>(html, 'window.RSI_LEADERBOARD=');
    const steps = jsonAfter<{agents: Record<string, {mean: number}>}>(html, 'window.STEPS=');
    const parts: Record<string, BoardPart> = {
      ms: { name: 'Day-0 Model Support', unit: '%' }, opt: { name: 'Inference Optimization', unit: 'speedup' },
    };
    if (agents.length < 15 || tasks.length < 37) throw new Error('Incomplete RSI-Inference results');
    const rows = agents.map(a => {
      if (!a.name || ![a.rating, a.ms, a.opt].every(Number.isFinite)) throw new Error('Incomplete joint rating for ' + a.name);
      const metrics: Record<string, number> = { ms: a.ms * 100, opt: a.opt, msLow: 100 * a.ms_lo, msHigh: 100 * a.ms_hi,
        optLow: a.opt_lo, optHigh: a.opt_hi };
      if (steps.agents[a.name]) metrics.steps = steps.agents[a.name].mean;
      if (a.runs.all.hours) metrics.hours = a.runs.all.hours.mean;
      for (const task of tasks) {
        const support = task.track === 'model_support';
        parts[task.id] = { name: [task.title, task.engine, task.variant].filter(Boolean).join(': '),
          group: support ? 'Day-0 Model Support' : 'Inference Optimization', unit: support ? '%' : 'speedup' };
        const entry = task.results.find(r => r.agent === a.name);
        const value = support ? entry?.pass_at_1 : entry?.speedup;
        if (typeof value === 'number') metrics[task.id] = value * (support ? 100 : 1);
      }
      return { model: a.name, score: a.rating, cost: a.runs.all.cost?.mean, tokens: a.runs.all.tok_out?.mean, metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
