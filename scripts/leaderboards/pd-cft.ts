// The paper evaluates Chinese cloze reading comprehension on People Daily and Children’s Fairy Tale.
// The headline is the plain mean of the four published accuracy parts because the paper gives no overall score.
// The source reports accuracy percentages while the catalog record uses brier, so rows carry a unit mismatch flag.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/1607.02250';
const board: Leaderboard = {
  benchmark: 'pd-cft', static: 'paper', url: 'https://arxiv.org/abs/1607.02250', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/1607.02250',
  headline: 'The paper reports no overall score, so this is the plain mean of its four accuracy parts.',
  parts: { peopleDailyValid: 'People Daily validation', peopleDailyTest: 'People Daily test', cftTestAuto: 'Children’s Fairy Tale automatic test', cftTestHuman: 'Children’s Fairy Tale human test' },
  async fetch() {
    const text = await pdfText(feed);
    const start = text.indexOf('People Daily      Children’s Fairy Tale');
    const end = text.indexOf('Table 5:', start);
    if (start < 0 || end < 0) throw new Error('People Daily and CFT results table missing');
    const block = text.slice(start, end);
    const rows: LeaderboardRow[] = [];
    const re = /^\s*(AS Reader|CAS Reader \(mode: (?:avg|sum|max)\))\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)$/gm;
    for (const match of block.matchAll(re)) {
      const values = match.slice(2).map(Number);
      rows.push({
        model: match[1], score: values.reduce((a, b) => a + b, 0) / values.length,
        metrics: { peopleDailyValid: values[0], peopleDailyTest: values[1], cftTestAuto: values[2], cftTestHuman: values[3] },
      });
    }
    if (rows.length !== 4) throw new Error('Expected four named model rows');
    return checked(rows, 4);
  },
};
export default board;
