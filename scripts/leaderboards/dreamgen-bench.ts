// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// DreamGen Bench tests robot video generation on RoboCasa and three GR1 task groups.
// The authors define each part's score in Section 4: "we use the average of IF (GPT) and PA from Table 2."
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.12705';
const groups = ['RoboCasa', 'GR1 Object', 'GR1 Behavior', 'GR1 Environment'];
const measures = ['IF (GPT)', 'IF (Qwen)', 'IF (Human)', 'PA'];
const board: Leaderboard = {
  benchmark: 'dreamgen-bench',
  url: 'https://github.com/NVIDIA/GR00T-Dreams',
  feed,
  terms: 'The authors publish Table 2 under the terms at https://arxiv.org/abs/2505.12705.',
  static: 'paper',
  headline: 'The headline averages the four task groups, each scored by averaging GPT-4o instruction following and physics alignment.',
  parts: Object.fromEntries(groups.flatMap(group => [group, ...measures.map(m => group + ': ' + m)].map(name => [name, name]))),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'Dataset Statistics');
    if (!table || table[1][1] !== 'RoboCasa' || table[1][5] !== 'GR1' ||
      !['Object', 'Behavior', 'Env'].every((k,i) => table[3][5+i*4]?.startsWith(k + ':')) ||
      !groups.every((_,i) => table[6].slice(1+i*4, 5+i*4).join('|') === 'GPT|Qwen|Hu|' &&
        table[5].slice(1+i*4, 5+i*4).join('|') === 'IF|IF|IF|PA')) throw new Error('DreamGen Table 2 columns changed');
    const rows = table.slice(7).map(([label, ...values]) => {
      const match = label.match(/^(.+)-(zero|sft)$/);
      if (!match || values.length !== 16) throw new Error('Unexpected DreamGen row: ' + label);
      const metrics: Record<string, number> = {};
      groups.forEach((group, i) => {
        const start = i * 4;
        metrics[group] = (numberCell(values[start]) + numberCell(values[start+3])) / 2;
        measures.forEach((measure, j) => {
          if (values[start+j] !== '-') metrics[group + ': ' + measure] = numberCell(values[start+j]);
        });
      });
      return { model: match[1], setting: match[2] === 'zero' ? 'Zero-shot' : 'Fine-tuned',
        score: groups.reduce((sum, group) => sum + metrics[group], 0) / groups.length, metrics };
    });
    return checked(rows, 8);
  },
};
export default board;
