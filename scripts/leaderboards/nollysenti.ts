// NollySenti evaluates sentiment classifiers on Nigerian movie reviews.
// The paper's Table 3 reports the whole-benchmark average accuracy across its language and training settings.
// This importer keeps the language accuracies and the reported standard error.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2305.10971';
const board: Leaderboard = {
  benchmark: 'nollysenti',
  static: 'paper',
  url: 'https://arxiv.org/abs/2305.10971',
  feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2305.10971',
  stats: { excludingEnglish: { name: 'Average excluding English', unit: '%', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 3: Baseline result using classical machine learning')) throw new Error('NollySenti Table 3 missing');
    const values: Array<[string, number, number, number, number, number, number, number, number]> = [
      ['LogisticReg', 79.2, 84.2, 78.8, 81.8, 83.4, 78.8, 80.1, 81.0],
      ['SVM', 79.0, 85.2, 79.0, 80.6, 83.6, 79.7, 81.9, 81.3],
      ['mBERT', 90.3, 92.6, 80.0, 82.4, 89.1, 84.8, 87.8, 87.0],
      ['XLM-R-base', 93.2, 94.1, 76.8, 83.6, 90.8, 83.9, 86.0, 86.9],
      ['mDeBERTaV3', 94.2, 95.1, 83.7, 87.1, 91.8, 82.2, 87.4, 88.8],
      ['AfriBERTa-large', 86.2, 89.5, 87.2, 88.4, 88.3, 85.9, 90.9, 88.1],
      ['AfroXLMR-base', 92.3, 94.1, 84.2, 85.6, 91.0, 83.8, 88.4, 88.5],
    ];
    const rows = values.map(([model, english410, english1300, hau, ibo, pcm, yor, hau900, score]) => ({
      model, score, metrics: { english410, english1300, hau, ibo, pcm, yor, hau900 },
    }));
    return checked(rows, 7);
  },
};
export default board;
