// FinMem compares trading decisions made by five language models using the same agent.
// Table 3 gives cumulative return on Tesla during the test period and four risk measures.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2311.13743';
const board: Leaderboard = {
  benchmark: 'finmem-trading',
  static: 'paper',
  url: feed + '#S6.T3',
  feed,
  terms: 'The authors publish the paper under the terms listed at https://arxiv.org/abs/2311.13743.',
  async fetch() {
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t[0].includes('Llama2-70b-chat'));
    const labels = ['Metric', 'Cumulative Return (%)', 'Sharpe Ratio', 'Daily Volatility (%)', 'Annualized Volatility (%)', 'Max Drawdown (%)'];
    if (!table || table[0][1] !== 'B&H' || labels.some((v, i) => table[i]?.[0] !== v)) throw new Error('Missing FinMem backbone comparison');
    return checked(table[0].slice(2).map((model, i) => ({
      model, harness: 'FinMem', setting: 'TSLA, June 16 to December 28, 2022',
      score: numberCell(table[1][i + 2]),
      metrics: {
        sharpeRatio: numberCell(table[2][i + 2]),
        dailyVolatility: numberCell(table[3][i + 2]),
        annualizedVolatility: numberCell(table[4][i + 2]),
        maxDrawdown: numberCell(table[5][i + 2]),
      },
    })), 5);
  },
};
export default board;
