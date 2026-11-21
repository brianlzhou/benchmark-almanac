// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// DriveBench evaluates answers to driving questions under clean, corrupted, and text-only inputs.
// The README reports GPT-judged scores in Benchmark Study and corruption awareness in Robustness Analysis.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/worldbench/drivebench/HEAD/README.md';
const tasks = ['Perception', 'Prediction', 'Planning', 'Behavior'];
const board: Leaderboard = {
  benchmark: 'drivebench', url: 'https://github.com/worldbench/drivebench#benchmark-study', feed,
  terms: 'The repository uses Apache License 2.0. https://www.apache.org/licenses/LICENSE-2.0',
  headline: 'The source reports no overall score, so the headline is the plain mean of the four driving task scores.',
  aliases: {'LLaVA-1.5 7B':'llava-v1-5-7b', 'LLaVA-1.5 13B':'llava-v1-5-13b', 'LLaVA-NeXT 7B':'llava-v1-6-mistral-7b',
    'Phi-3.5 4.2B':'phi-3-5-vision-instruct','Qwen2-VL 7B':'qwen2-vl-7b-instruct','Qwen2-VL 72B':'qwen2-vl-72b-instruct'},
  async fetch() {
    const all = tables(await fetchText(feed)).map(grid);
    const study = all.find(t => t[0]?.[3]?.includes('Perception'));
    const robustness = all.find(t => t[0]?.[3] === 'Weather');
    if (!study || !robustness || robustness[0].length !== 18) throw new Error('Missing DriveBench tables');
    const rows: LeaderboardRow[] = [];
    board.parts = Object.fromEntries(tasks.map(task => [task, task]));
    for (const [name, size, type, ...values] of study.slice(1)) {
      if (!name || name === 'Human') continue;
      if (values.length !== 12) throw new Error('Missing DriveBench score');
      const model = size === '-' ? name : name + ' ' + size;
      for (const [i, setting] of ['Clean', 'Corrupted', 'Text only'].entries()) {
        const metrics: Record<string,number> = {};
        const condition = ['Clean','Corr.','T.O.'][i];
        for (const [j,task] of tasks.entries()) {
          const col = 3*j+i;
          if (study[0][col+3] !== task + ' ( ' + condition + ' )') throw new Error('Unexpected task or input condition');
          metrics[task] = numberCell(values[col]);
        }
        const score = Object.values(metrics).reduce((a,b) => a+b, 0) / tasks.length;
        if (i === 1) {
          const extra = robustness.slice(2).find(r => r[0] === name && r[1] === size);
          if (!extra || extra.length !== 18) throw new Error('Missing corruption awareness results for ' + model);
          for (let col=3; col<extra.length; col++) {
            const key = robustness[0][col] + ': ' + robustness[1][col];
            metrics[key] = numberCell(extra[col]);
            board.parts[key] = {name: key, group: 'Corruption awareness'};
          }
        }
        rows.push({model, setting, score, metrics, open: type === 'Open' ? true : undefined, params: size === '-' ? undefined : parseFloat(size)});
      }
    }
    return checked(rows, 36);
  },
};
export default board;
