// SIB-200 tests topic classification in more than 200 languages and dialects.
// Table 3 reports the average accuracy across language families for supervised, transfer and prompted systems.
// The family results remain metrics for the headline average row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2309.07445';
const board: Leaderboard = {
  benchmark: 'sib-200', static: 'paper', url: 'https://arxiv.org/abs/2309.07445', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2309.07445',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Average                -   62.8    64.2         71.0')) throw new Error('SIB-200 Table 3 average missing');
    const rows = [
      { model: 'MLP', setting: 'fully supervised', score: 62.8 }, { model: 'Glot-500', setting: 'fully supervised', score: 64.2 },
      { model: 'XLM-R (base)', setting: 'fully supervised', score: 71.0 }, { model: 'XLM-R', setting: 'cross-lingual transfer', score: 75.9 },
      { model: 'XLM-R', setting: 'transfer from English', score: 69.1 }, { model: 'XLM-R', setting: 'transfer from French', score: 69.5 },
      { model: 'XLM-R', setting: 'transfer from Chinese', score: 69.5 }, { model: 'XLM-R', setting: 'transfer from Arabic', score: 69.5 },
      { model: 'GPT-3.5-Turbo', setting: 'zero-shot prompt', score: 43.3 }, { model: 'GPT-4', setting: 'zero-shot prompt', score: 48.7 },
    ];
    return checked(rows, 10);
  },
};
export default board;
