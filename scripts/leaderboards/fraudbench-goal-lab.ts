// FraudBench tests whether language models produce fraudulent behavior in binary QA, open QA, and agentic tasks.
// The headline is the plain mean of the three fraud-rate percentages because the paper reports no overall fraud rate.
// This importer reads Table 3 in the benchmark paper and keeps each task's fraud rate in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2611.12167';
const board: Leaderboard = {
  benchmark: 'fraudbench-goal-lab', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  headline: 'The paper reports no overall fraud rate, so this is the plain mean of its binary, open, and agentic fraud rates.',
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find(t => t[0]?.[0] === '' && t[0]?.[1] === 'Binary' && t[0]?.[5] === 'Open' && t[0]?.[9] === 'Agentic' && t[1]?.[0] === 'Model');
    if (!table) throw new Error('FraudBench Table 3 missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      const model = row[0]?.replace(/\s+r\s+\{.*$/, '').trim();
      if (!model || /^(Overall|Human)/.test(model)) continue;
      const nums = row.slice(1).map(Number);
      if (nums.length < 12 || nums.some(Number.isNaN)) continue;
      const binary = nums[0], open = nums[4], agentic = nums[8];
      rows.push({ model, score: (binary + open + agentic) / 3, metrics: { binaryFraudRate: binary, openFraudRate: open, agenticFraudRate: agentic } });
    }
    return checked(rows, 10);
  },
};
export default board;
