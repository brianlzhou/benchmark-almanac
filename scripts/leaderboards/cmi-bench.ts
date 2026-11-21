// MuTheoryEval measures accuracy on its CMI-Bench audio questions. Its JSON stores fractional accuracy for each run.
// The board displays percentages and reports the estimated cost of the whole run.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

interface Cell {
  benchmark: string; model: string; mode: string; accuracy: number; n: number; seed: number; timestamp: string;
  cost_est_usd?: number; elapsed_sec?: number; config?: Record<string, unknown>; usage?: Record<string, number>;
  error_counts?: Record<string, number>; task_accuracy?: Record<string, {accuracy: number; n: number; correct: number}>;
}
export async function musicResults(board: Leaderboard, key: string, minimum: number) {
  const data = await fetchJson<{ models: { key: string; display_name: string }[]; cells: Cell[] }>(board.feed);
  const names = new Map(data.models.map(m => [m.key, m.display_name]));
  const cells = data.cells.filter(c => c.benchmark === key);
  if (cells.length < minimum) throw new Error('Incomplete music results for ' + key);
  board.parts = {};
  return cells.map(c => {
    const model = names.get(c.model);
    if (!model || !Number.isFinite(c.accuracy) || !(c.n > 0) || !c.timestamp || !c.mode)
      throw new Error('Incomplete music result for ' + c.model);
    const settings = Object.entries(c.config ?? {}).filter(([k,v]) => v != null && k !== 'system_prompt_hash')
      .map(([k,v]) => k + '=' + (typeof v === 'object' ? JSON.stringify(v) : String(v)));
    const metrics: Record<string, number> = { questions: c.n, seed: c.seed, ...c.error_counts, ...c.usage };
    if (c.elapsed_sec != null) metrics.elapsedSeconds = c.elapsed_sec;
    for (const [task, result] of Object.entries(c.task_accuracy ?? {})) {
      if (!Number.isFinite(result.accuracy)) throw new Error('Missing accuracy for ' + task);
      const k = 'task_' + task.replace(/[^a-zA-Z0-9]+/g, '_');
      board.parts![k] = { name: task, unit: '%' };
      metrics[k] = result.accuracy * 100;
    }
    const output = c.usage?.total_completion_tokens;
    return { model, setting: [c.mode, ...settings].join(', '), date: c.timestamp.slice(0, 10),
      score: c.accuracy * 100, cost: c.cost_est_usd, tokens: output == null ? undefined : output / c.n, metrics };
  });
}

const feed = "https://thevertexlab.github.io/MuTheoryEval/data.json";
const board: Leaderboard = {
  benchmark: 'cmi-bench',
  url: "https://thevertexlab.github.io/MuTheoryEval/",
  feed,
  terms: "The host returns a missing page for robots.txt. The runner repository uses the MIT License. https://raw.githubusercontent.com/thevertexlab/MuTheoryEval/main/LICENSE",
  host: 'MuTheoryEval',
  costPer: 'run',
  async fetch() {
    return musicResults(board, 'cmi_bench', 3);
  },
};
export default board;
