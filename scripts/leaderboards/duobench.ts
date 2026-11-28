// The source reports no overall score. The headline is the plain mean of the 11 parts, computed by this importer.
// DuoBench tests bimanual robot manipulation. The project site's simulation table gives success rates from 300 rollouts per task.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://duobench.github.io/';
const board: Leaderboard = {
  benchmark: 'duobench', url: feed, feed,
  terms: 'The authors publish these simulation results at https://duobench.github.io/.',
  headline: 'The project reports no overall score, so the headline averages the success rates on its 11 simulation tasks.',
  stats: Object.fromEntries([
    'Hinge-Chest Final progress', 'Hinge-Chest: cube + lid pass rate', 'Hinge-Chest: lid or cube pass rate', 'Spring-Door Final progress', 'Spring-Door: box + door pass rate',
    'Pour-Marbles Final progress', 'Pour-Marbles: pour all pass rate', 'Carry-Pot Final progress', 'Carry-Pot: grasp + lift pass rate',
    'Ball-Maze Final progress', 'Ball-Maze: ball to goal pass rate', 'Block-Balance Final progress', 'Block-Balance: grasp rects pass rate',
    'Join-Blocks Final progress', 'Join-Blocks: connect pass rate', 'Transfer-Cube Final progress', 'Transfer-Cube: pick cube pass rate',
    'Transfer-Gate Final progress', 'Transfer-Gate: pick box pass rate', 'Transfer-Reorient Final progress',
    'Transfer-Reorient: insert pass rate', 'Bin-Sort Final progress', 'Bin-Sort: pick 2nd pass rate',
  ].map(key => [key, { name: key, unit: 'score', better: 'higher', note: 'Success or progress value from 0 to 1.' }])),
  async fetch() {
    const html = (await fetchText(feed)).replaceAll('&pi;<sub>0.5</sub>', 'π0.5');
    const table = tables(html).find(t => t[0]?.map(c => c.text).join('|') === 'Task|ACT|π0.5|X-VLA');
    if (!table || !html.includes('300 rollouts per cell') || table[1].filter(c => c.text === 'SR [CI]').length !== 3)
      throw new Error('DuoBench simulation columns changed');
    const tasks = table.slice(2).filter(cells => cells.length !== 1);
    if (tasks.length !== 11 || tasks.some(cells => cells.length !== 10)) throw new Error('Expected 11 DuoBench tasks');
    board.parts = Object.fromEntries(tasks.map(([name]) => [name.text, name.text]));
    return checked(table[0].slice(1).map(({text: model}, i) => {
      const metrics: Record<string, number> = {};
      let sum = 0;
      for (const row of tasks) {
        const task = row[0].text;
        const match = row[1+3*i].text.match(/^(\d+(?:\.\d+)?)\s*\[(\d+)–(\d+)\]$/);
        const progress = row[2+3*i].text;
        const stage = row[3+3*i].text.match(/^(.+) \(([\d.]+)\)$/);
        if (!match || !/^\d+\.\d+$/.test(progress) || !stage) throw new Error('Invalid DuoBench data for ' + task);
        metrics[task] = Number(match[1]);
        metrics[task + 'Low'] = Number(match[2]);
        metrics[task + 'High'] = Number(match[3]);
        metrics[task + ' Final progress'] = Number(progress);
        metrics[task + ': ' + stage[1] + ' pass rate'] = Number(stage[2]);
        sum += metrics[task];
      }
      return {model, setting: 'Simulation', trials: 300 * tasks.length, score: sum / tasks.length, metrics};
    }), 3);
  },
};
export default board;
