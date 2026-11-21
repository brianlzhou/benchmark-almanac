// The source reports no overall score. The headline is the plain mean of the 12 parts, computed by this importer.
// Table 2 measures directional accuracy and mean absolute error for financial forecasts from earnings calls.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2609.38523';
const tasks = ['car', 'ret_eom', 'ret_l5m', 'ret_ldm', 'fut_3d', 'fut_7d', 'fut_15d', 'fut_30d', 'past_3d', 'past_7d', 'past_15d', 'past_30d'];
const parts: Record<string, BoardPart> = {};
for (const task of tasks) {
  parts[task] = { name: task, group: 'Directional accuracy' };
  parts[task + ' MAE'] = { name: task, group: 'Mean absolute error', unit: 'score', better: 'lower' };
}
const board: Leaderboard = {
  benchmark: 'mm-fineval', url: feed, feed, static: 'paper', parts,
  headline: 'The paper gives no overall directional accuracy, so this is the plain mean of its 12 task accuracies.',
  terms: 'The authors list the paper license at https://arxiv.org/abs/2609.38523.',
  aliases: {
    'Qw3.5-2B': 'qwen3-5-2b', 'Qw3.5-4B': 'qwen3-5-4b', 'Qw3.5-9B': 'qwen3-5-9b', 'Qw3.5-27B': 'qwen3-5-27b',
    'Qw3.5-35B': 'qwen3-5-35b-a3b', 'Qw3.6-27B': 'qwen3-6-27b', 'Qw3.6-35B': 'qwen-3-6-35b-a3b',
    'Cld-4.6': 'claude-sonnet-4-6', 'Cld-4.8': 'claude-opus-4-8', 'Vox-24B': 'voxtral-small',
    'Gm4-E2B': 'gemma-4-e2b-it', 'Gm4-E4B': 'gemma-4-e4b-it',
  },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[1]?.[0] === 'Label' && t[1]?.[1] === 'Metric' && t[0].includes('Any-to-Any'));
    if (!table || table.length !== 26) throw new Error('Missing 12-task forecasting table');
    const rows = table[1].slice(2).map((model, i) => {
      const metrics: Record<string, number> = {};
      for (const [task, measure, ...values] of table.slice(2)) {
        if (!tasks.includes(task)) throw new Error('Unknown financial task: ' + task);
        if (measure === 'DA \\uparrow' && values[i].endsWith('%')) metrics[task] = numberCell(values[i].slice(0, -1));
        else if (measure === 'MAE \\downarrow') metrics[task + ' MAE'] = numberCell(values[i]);
        else throw new Error('Unexpected forecasting measure: ' + measure);
      }
      if (Object.keys(metrics).length !== 24) throw new Error('Incomplete results for ' + model);
      return { model, setting: table[0][i + 2], score: tasks.reduce((s, task) => s + metrics[task], 0) / tasks.length, metrics };
    });
    return checked(rows, 19);
  },
};
export default board;
