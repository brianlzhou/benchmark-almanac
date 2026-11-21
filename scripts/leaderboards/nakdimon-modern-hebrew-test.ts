// The paper evaluates modern Hebrew diacritization on the Nakdimon test set.
// It reports four document-level accuracy parts and no overall score.
// This importer uses their plain mean and keeps each accuracy part beside it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2105.05209';
const board: Leaderboard = {
  benchmark: 'nakdimon-modern-hebrew-test',
  static: 'paper',
  url: 'https://arxiv.org/abs/2105.05209',
  feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2105.05209',
  stats: { character: { name: 'Character accuracy', unit: '%', better: 'higher' }, word: { name: 'Word accuracy', unit: '%', better: 'higher' }, vocalization: { name: 'Vocalization accuracy', unit: '%', better: 'higher' }, oovWord: { name: 'Out-of-vocabulary word accuracy', unit: '%', better: 'higher' }, oovVocalization: { name: 'Out-of-vocabulary vocalization accuracy', unit: '%', better: 'higher' } },
  headline: 'The paper reports no overall score, so this is the plain mean of its four document-level accuracy parts.',
  parts: {
    decisionAccuracy: 'Decision accuracy',
    characterAccuracy: 'Character accuracy',
    wordAccuracy: 'Word accuracy',
    vocalizationAccuracy: 'Vocalization accuracy',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 3: Document-level macro % accuracy')) throw new Error('Nakdimon Table 3 missing');
    const values: Array<[string, number, number, number, number]> = [
      ['Snopi', 91.29, 85.84, 76.45, 78.91],
      ['Morfix', 96.84, 94.92, 90.38, 92.39],
      ['Dicta', 97.95, 96.77, 94.11, 94.92],
      ['Nakdimon', 97.91, 96.37, 89.75, 91.64],
    ];
    const rows: Array<LeaderboardRow & { flag: string }> = values.map(([model, decisionAccuracy, characterAccuracy, wordAccuracy, vocalizationAccuracy]) => ({
      model,
      score: (decisionAccuracy + characterAccuracy + wordAccuracy + vocalizationAccuracy) / 4,
      metrics: { decisionAccuracy, characterAccuracy, wordAccuracy, vocalizationAccuracy },
      flag: 'computed-mean',
    }));
    return checked(rows, 4);
  },
};
export default board;
