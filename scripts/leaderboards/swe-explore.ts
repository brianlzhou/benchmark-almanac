// SWE-Explore measures repository exploration quality at a fixed top-five region budget.
// The repository README's main-results chart reports six underlying LLMs and ten metrics.
// The headline is line-level F1, shown as a percentage in the catalog.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/Qiushao-E/SWE-Explore-Bench/HEAD/figures/main-results.png';
const board: Leaderboard = {
  benchmark: 'swe-explore', url: 'https://github.com/Qiushao-E/SWE-Explore-Bench', feed,
  terms: 'The repository publishes the chart under its project terms. https://github.com/Qiushao-E/SWE-Explore-Bench',
  async fetch() {
    return checked((await chartRows(feed, '162208f7d482d648b3c26c1367bcde34931e7fc2ac6219ac8a9bcc00e2aa7d54', [
      { model: 'GPT-5.4', score: 19.4, metrics: { hitReg: 51.6, precision: 54.2, recall: 15.4, hitFile: 65.5, ndcg: 90.5, recallAt500: 15.4, fuh: 92.7, contextEfficiency: 77.1, noiseReg: 25.8 } },
      { model: 'GPT-5.4-mini', score: 21.5, metrics: { hitReg: 53.1, precision: 50.9, recall: 18.5, hitFile: 64.9, ndcg: 92.4, recallAt500: 18.3, fuh: 95.6, contextEfficiency: 75.4, noiseReg: 26.5 } },
      { model: 'Kimi-K2.6', score: 14.9, metrics: { hitReg: 41.3, precision: 47.5, recall: 11.7, hitFile: 50.9, ndcg: 73.9, recallAt500: 11.5, fuh: 75.9, contextEfficiency: 67.6, noiseReg: 31.6 } },
      { model: 'Sonnet-4.5', score: 15.4, metrics: { hitReg: 42.8, precision: 51.9, recall: 11.8, hitFile: 53.5, ndcg: 77.9, recallAt500: 11.6, fuh: 80.2, contextEfficiency: 71.5, noiseReg: 27.9 } },
      { model: 'GLM-4.7', score: 14.8, metrics: { hitReg: 28.9, precision: 41.4, recall: 12.2, hitFile: 34.3, ndcg: 55.7, recallAt500: 10.5, fuh: 57.2, contextEfficiency: 53.6, noiseReg: 46.5 } },
      { model: 'Gemini-3-Pro', score: 7.9, metrics: { hitReg: 26.8, precision: 42.0, recall: 5.2, hitFile: 36.9, ndcg: 60.5, recallAt500: 5.2, fuh: 62.0, contextEfficiency: 54.0, noiseReg: 46.7 } },
    ])).map(row => ({ ...row, score: row.score })));
  },
};
export default board;
