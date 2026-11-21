// ReTrace evaluates computer-use agents' ability to recover from failed states.
// Table 3 reports OSWorld end-to-end success rates for four named models with and without recovery.
// The source's confidence intervals remain beside each score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2610.27954';
const board: Leaderboard = {
  benchmark: 'retrace', static: 'paper', url: 'https://arxiv.org/abs/2610.27954', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2610.27954',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 3: End-to-end task success rate (SR) on OSWorld')) throw new Error('ReTrace Table 3 missing');
    const rows = [
      { model: 'Sonnet-4.6', setting: 'Baseline', score: 70.27, metrics: { stderr: 0.70 } },
      { model: 'Sonnet-4.6', setting: 'w/ Recovery', score: 71.81, metrics: { stderr: 1.51 } },
      { model: 'Qwen3.5-9B', setting: 'Baseline', score: 38.76, metrics: { stderr: 0.64 } },
      { model: 'Qwen3.5-9B', setting: 'w/ Recovery', score: 41.56, metrics: { stderr: 4.14 } },
      { model: 'UI-TARS-1.5-7B', setting: 'Baseline', score: 17.25, metrics: { stderr: 1.55 } },
      { model: 'UI-TARS-1.5-7B', setting: 'w/ Recovery', score: 15.74, metrics: { stderr: 0.65 } },
      { model: 'EvoCUA-32B', setting: 'Baseline', score: 54.88, metrics: { stderr: 4.39 } },
      { model: 'EvoCUA-32B', setting: 'w/ Recovery', score: 51.55, metrics: { stderr: 2.54 } },
    ];
    return checked(rows, 8);
  },
};
export default board;
