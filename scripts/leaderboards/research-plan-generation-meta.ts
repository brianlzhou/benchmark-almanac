// Research Plan Generation evaluates whether models produce useful plans for scientific papers.
// Table 10 reports overall win rates for three finetuned model comparisons on eight subject domains.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2512.23707';
const board: Leaderboard = {
  benchmark: 'research-plan-generation-meta', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2512.23707',
  parts: { addressesRequirements: 'Addresses Requirements', clearExecution: 'Clear Execution', feasibility: 'Feasibility', predictedOutcomes: 'Predicted Outcomes', soundness: 'Soundness' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Model Pair|Domain|Overall WR|Scores (A/B)|Addresses Requirements|Clear Execution|Feasibility|Predicted Outcomes|Soundness');
    if (!table) throw new Error('Research plan results table missing');
    const rows = table.slice(1).map(row => {
      if (row.length !== 9) throw new Error('Invalid research plan row');
      const values = row.slice(2).map(v => Number(v.match(/^\d+(?:\.\d+)?/)?.[0] ?? NaN));
      if (!values.every(Number.isFinite)) throw new Error('Invalid research plan score');
      return { model: row[0], setting: row[1], score: values[0], metrics: { addressesRequirements: values[2], clearExecution: values[3], feasibility: values[4], predictedOutcomes: values[5], soundness: values[6] } };
    });
    return checked(rows, 3);
  },
};
export default board;
