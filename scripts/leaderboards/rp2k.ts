// RP2K tests fine-grained retail product image classification.
// Table 2 reports overall Top-1 and Top-5 accuracy for four named classifiers.
// The Top-1 column is the headline and Top-5 remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2006.12634';
const board: Leaderboard = {
  benchmark: 'rp2k', static: 'paper', url: 'https://arxiv.org/abs/2006.12634', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2006.12634',
  headline: 'The paper reports Top-1 first, so this is the overall Top-1 accuracy column.',
  parts: { top1: 'Top-1 accuracy', top5: 'Top-5 accuracy', dairies: 'Dairies Top-1', dairiesTop5: 'Dairies Top-5', liquors: 'Liquors Top-1', liquorsTop5: 'Liquors Top-5', beers: 'Beers Top-1', beersTop5: 'Beers Top-5', cosmetics: 'Cosmetics Top-1', cosmeticsTop5: 'Cosmetics Top-5', nonAlcoholDrinks: 'Non-alcohol drinks Top-1', nonAlcoholDrinksTop5: 'Non-alcohol drinks Top-5', seasonings: 'Seasonings Top-1', seasoningsTop5: 'Seasonings Top-5', tobacco: 'Tobacco Top-1', tobaccoTop5: 'Tobacco Top-5' },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('All                        384,311      95.18% 99.01%')) throw new Error('RP2K overall classification row missing');
    const rows = [
      { model: 'ResNet-34', score: 95.18, metrics: { top1: 95.18, top5: 99.01 } },
      { model: 'InceptionV3', score: 94.69, metrics: { top1: 94.69, top5: 98.96 } },
      { model: 'CBL', score: 87.66, metrics: { top1: 87.66, top5: 93.79 } },
      { model: 'API-Net', score: 95.34, metrics: { top1: 95.34, top5: 98.65 } },
    ];
    return checked(rows, 4);
  },
};
export default board;
