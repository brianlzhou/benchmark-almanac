// PUCRS inpatient fall detection classifies falls in electronic health record notes.
// The repository's results PDF reports five-fold F-measure for named embedding and classifier configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/nlp-pucrs/fall-detection/master/BM1_13_Fall_Detection_in_EHR.pdf';

const board: Leaderboard = {
  benchmark: 'pucrs-inpatient-fall-detection',
  static: 'paper',
  url: 'https://github.com/nlp-pucrs/fall-detection',
  feed: FEED,
  terms: 'The repository is licensed under the MIT License. https://github.com/nlp-pucrs/fall-detection/blob/master/LICENSE',
  async fetch() {
    const paper = await pdfText(FEED);
    if (!paper.includes('Embeddings 5-Fold Cross Validation: F-Measure') || !paper.includes('Random Forest')) {
      throw new Error('Fall detection results tables missing');
    }
    const rows: LeaderboardRow[] = [
      { model: 'Word2Vec', setting: 'Wikipedia', score: 88, metrics: { std: 14 } },
      { model: 'FastText', setting: 'Wikipedia', score: 87, metrics: { std: 11 } },
      { model: 'Word2Vec', setting: 'NILC broad-domain', score: 77, metrics: { std: 6 } },
      { model: 'FastText', setting: 'NILC broad-domain', score: 89, metrics: { std: 13 } },
      { model: 'Word2Vec', setting: 'EHR biomedical-domain', score: 88, metrics: { std: 14 } },
      { model: 'FastText', setting: 'EHR biomedical-domain', score: 90, metrics: { std: 13 } },
      { model: 'Random Forest', score: 73, metrics: { std: 3 } },
      { model: 'SVM', score: 60, metrics: { std: 5 } },
    ];
    return checked(rows, 8);
  },
};

export default board;
