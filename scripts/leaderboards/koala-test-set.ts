// The Koala test set measures human preference among dialogue-model responses.
// The headline score is the percentage of Koala Test Set responses where Koala-All is better than the named model.
// The source publishes only a stacked chart, so this importer transcribes its rounded bar percentages and checks the image hash.
import { createHash } from 'node:crypto';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes } from '../lib/util.ts';

const feed = 'https://bair.berkeley.edu/static/blog/koala/results.png';
const IMAGE_SHA256 = '8c5596c135a2365e261c75ba6b435322e8b618f4e5aff9478e95b0979c66554c';

const board: Leaderboard = {
  benchmark: 'koala-test-set',
  url: 'https://bair.berkeley.edu/blog/2023/04/03/koala/',
  feed,
  static: 'paper',
  terms: 'The chart is published in the BAIR Koala article for research use. https://bair.berkeley.edu/blog/2023/04/03/koala/ The article requests research use of the test set.',
  parts: { alpacaTestSet: 'Alpaca Test Set' },
  async fetch() {
    const image = Buffer.from(await fetchBytes(feed));
    if (createHash('sha256').update(image).digest('hex') !== IMAGE_SHA256) throw new Error('Koala results chart changed');
    const rows: LeaderboardRow[] = [
      { model: 'Alpaca', score: 48, metrics: { tied: 22, worse: 30, alpacaTestSet: 32 } },
      { model: 'Koala-Distill', score: 34, metrics: { tied: 26, worse: 40, alpacaTestSet: 26 } },
      { model: 'ChatGPT', score: 30, metrics: { tied: 26, worse: 44, alpacaTestSet: 31 } },
    ];
    return rows;
  },
};

export default board;
