// EvaLearn tests learning from sequences of tasks. Tables 2 and 5 report overall
// accuracy and six task accuracies. Table 5 adds few-shot and demonstration settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.02672';
const parts = { Sum: 'Summarization', Cla: 'Classification', Ex: 'Extraction', LR: 'Logical Reasoning', MR: 'Mathematical Reasoning', SR: 'Sequential Reasoning' };
const board: Leaderboard = {
  benchmark: 'evalearn', static: 'paper', url: feed, feed, parts,
  terms: 'The paper is available under the terms linked at https://arxiv.org/abs/2506.02672.',
  aliases: { 'DeepSeek-V3 (snapshot unspecified)': 'deepseek-v3', 'DeepSeek-R1 (snapshot unspecified)': 'deepseek-r1', 'OpenAI-o3-mini': 'o3-mini' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const rows: LeaderboardRow[] = [];
    for (const order of ['Sum Cla Ex LR MR SR', 'Cla Ex LR MR SR Sum']) {
      const keys = order.split(' ');
      const table = tables.find(t => t[0].join(' ') === 'Model Paradigm ' + order + ' Overall');
      if (!table) throw new Error('Missing model accuracy table');
      for (const [name, paradigm, ...values] of table.slice(1)) {
        if (name === paradigm) continue;
        if (keys[0] === 'Cla' && ['Zero-shot', 'Feedback Learning'].includes(paradigm)) continue;
        if (values.length !== 7) throw new Error('Missing task score for ' + name);
        const scores = values.map(v => numberCell(v.split(' ')[0]));
        const thinking = name.endsWith('-Thinking');
        const model = name === 'Gemini-2.5-Flash' ? name + ' (snapshot unspecified)' : name;
        rows.push({ model: thinking ? name.slice(0, -9) : model, setting: thinking ? paradigm + ', thinking' : paradigm,
          score: scores[6], metrics: Object.fromEntries(keys.map((key, i) => [key, scores[i]])) });
      }
    }
    return checked(rows, 40);
  },
};
export default board;
