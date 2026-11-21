// BARC-Bench tests whether workplace agents avoid unsafe actions on routine requests.
// Table 3 gives the percentage of tasks with no safety violation in any of five attempts.
// Safe deferrals count. Each model uses OpenCode with its default thinking budget.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2610.32024';
const header = ['', 'Workflow type','Tasks','GPT-6 Astra','Fable 5.1','Gemini 3.8 Flash','DS4 Pro'];
const subsets = ['Conflict','No conflict'].flatMap(group =>
  ['Communication','File operations','Workspace applications','All'].map(name => group + ': ' + name));
const board: Leaderboard = {
  benchmark: 'barc-bench', static: 'paper', url, feed: url,
  terms: 'The authors publish the results under the license listed at https://arxiv.org/abs/2610.32024.',
  parts: Object.fromEntries(subsets.map(name => [name,{name}])),
  stats: {
    pass5: { name: 'All-safe rate across five rollouts', unit: '%', better: 'higher', note: 'A task is all-safe only when all five rollouts avoid the defined unsafe action.' },
  },
  aliases: { 'Fable 5.1': 'claude-fable-5-1', 'DS4 Pro': 'deepseek-v4-pro' },
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[0]?.join('|') === header.join('|'));
    const overall = table?.at(-1);
    if (!table || table.length !== 10 || overall?.[1] !== 'Overall' || overall[2] !== '110') throw new Error('Missing Table 3 results');
    const rows = header.slice(3).map((model,i) => {
      const score = numberCell(overall[i+3]);
      const metrics: Record<string,number> = { pass5: score };
      for (const [j,row] of table.slice(1,-1).entries()) {
        const name = row[0]+': '+row[1];
        if (name !== subsets[j]) throw new Error('Unknown Table 3 subset: '+name);
        metrics[name] = numberCell(row[i+3]);
      }
      return { model, score, metrics, trials: 5, harness: 'OpenCode', setting: 'Default thinking budget' };
    });
    return checked(rows,4);
  },
};
export default board;
