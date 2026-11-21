// QuantEval tests financial knowledge, reasoning and strategy coding.
// Table 2 reports separate measures, so the headline uses the first Knowledge QA accuracy column.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2601.08689';
const board: Leaderboard = {
  benchmark: 'quanteval', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2601.08689',
  headline: 'The paper reports no overall score, so this is the Knowledge QA accuracy with chain of thought, its first ranked measure.',
  parts: { knowledgeQA: 'Knowledge QA accuracy', reasoning: 'Reasoning accuracy' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[1] === 'Knowledge QA (Acc.%)' && t[1]?.[0] === 'Model');
    if (!table) throw new Error('QuantEval results table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (!row[0] || ['Human Expert', 'Open-Source Models', 'Proprietary Models'].includes(row[0])) continue;
      if (row.length !== 12 || !/^\d+(?:\.\d+)?$/.test(row[1]) || !/^\d+(?:\.\d+)?$/.test(row[4])) throw new Error('Invalid QuantEval row');
      rows.push({ model: row[0], score: Number(row[1]), metrics: { knowledgeQA: Number(row[1]), reasoning: Number(row[4]), executionRate: Number(row[7]) } });
    }
    return checked(rows, 13);
  },
};
export default board;
