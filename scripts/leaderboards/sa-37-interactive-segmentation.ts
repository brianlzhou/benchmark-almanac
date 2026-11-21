// SA-37 measures interactive single-image segmentation across 37 datasets.
// Table 5 reports the SA-23 average one-click mIoU for three named model and training-data variants.
// The five-click and domain averages remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2408.00714';
const board: Leaderboard = {
  benchmark: 'sa-37-interactive-segmentation', static: 'paper', url: 'https://arxiv.org/abs/2408.00714', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2408.00714',
  headline: 'Table 5 lists the one-click SA-23 average first, so this is its one-click mIoU.',
  parts: { sa23All: 'SA-23 all datasets', sa23Image: 'SA-23 image datasets', sa23Video: 'SA-23 video datasets', newVideo: '14 new video datasets' },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 5 Zero-shot accuracy on the Segment Anything (SA) task across 37 datasets')) throw new Error('SA-37 Table 5 missing');
    const rows = [
      { model: 'SAM', setting: 'SA-1B', score: 58.1, metrics: { click5: 81.3, sa23All: 58.1, sa23Image: 60.8, sa23ImageClick5: 82.1, sa23Video: 54.5, sa23VideoClick5: 80.3, newVideo: 59.1, newVideoClick5: 83.4 } },
      { model: 'SAM 2', setting: 'SA-1B', score: 58.9, metrics: { click5: 81.7, sa23All: 58.9, sa23Image: 60.8, sa23ImageClick5: 82.1, sa23Video: 56.4, sa23VideoClick5: 81.2, newVideo: 56.6, newVideoClick5: 83.7 } },
      { model: 'SAM 2', setting: 'our mix', score: 61.9, metrics: { click5: 83.5, sa23All: 61.9, sa23Image: 63.3, sa23ImageClick5: 83.8, sa23Video: 60.1, sa23VideoClick5: 83.2, newVideo: 69.6, newVideoClick5: 85.8 } },
    ];
    return checked(rows, 3);
  },
};
export default board;
