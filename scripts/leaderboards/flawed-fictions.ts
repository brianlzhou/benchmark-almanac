// Flawed Fictions tests whether a model can locate plot holes in stories.
// Table 5 gives CEEval-Full over stories with and without errors, alongside classification results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2504.11900';
const columns = ['Accuracy', 'Precision', 'Recall', 'F1-score', 'CEEval-Pos', 'CEEval-Full'];
const board: Leaderboard = {
  stats: { 'CEEval-Full': { name: 'Causal error evaluation full score', unit: 'score', better: 'higher' } },
  benchmark: 'flawed-fictions', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { 'DeepSeek-R1-Qwen-32B': 'deepseek-r1-distill-qwen-32b', 'DeepSeek-R1-Qwen-14B': 'deepseek-r1-distill-qwen-14b' },
  parts: Object.fromEntries(columns.slice(0,-1).map(name => [name, name])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t.at(-1)?.[0] === 'Human Performance' &&
      t.some(r => r[0] === 'Entailment Baseline') && t.some(r => r[0].includes('with Verifier')) &&
      JSON.stringify(t[1]?.slice(1)) === JSON.stringify(columns));
    if (!table) throw Error('Missing Flawed Fictions results columns');
    const rows: LeaderboardRow[] = [];
    let model = '';
    for (const cells of table.slice(2)) {
      if (/Baseline$|^Human Performance$/.test(cells[0])) continue;
      const label = cells[0].replaceAll('‡', '').trim();
      const match = /^(.*?)\s*\((?:with )?([^()]+)\)$/.exec(label);
      if (!match || match[1]) model = match ? match[1] : label;
      const metrics = Object.fromEntries(columns.map((key,i) => [key, cells[i+1]?.trim() ? Number(cells[i+1]) : NaN]));
      if (!Object.values(metrics).every(Number.isFinite)) throw Error('Invalid metrics for ' + label);
      rows.push({ model, setting: match?.[2], score: metrics['CEEval-Full'], metrics });
    }
    return checked(rows, 30);
  },
};
export default board;
