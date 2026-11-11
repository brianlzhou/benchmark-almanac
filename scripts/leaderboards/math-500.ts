// MATH-500 on Vals AI. The leaderboard's Accuracy column is exact-answer accuracy on the 500-question
// MATH-500 split, updated 2026-01-09. Vals runs models in one evaluation harness; labs more often report
// pass@1 with different prompting, so each row carries the Vals harness setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = 'https://vals-ai.com/benchmarks/math500';
const board: Leaderboard = {
  benchmark: 'math-500',
  url: FEED,
  feed: FEED,
  terms: 'Vals AI publishes public benchmark results and methodology. The almanac credits and links Vals AI and follows its source terms.',
  async fetch(): Promise<LeaderboardRow[]> {
    const table = tables(await fetchText(FEED)).find((t) => t[0]?.some((c) => c.text === 'Accuracy'));
    if (!table) throw new Error('MATH-500 Vals table missing');
    const headers = table[0].map((c) => c.text);
    const model = headers.indexOf('Model');
    const score = headers.indexOf('Accuracy');
    if (model < 0 || score < 0) throw new Error('MATH-500 Vals columns missing');
    const rows = table.slice(1).flatMap((r) => {
      const value = num(r[score]?.text);
      const name = r[model]?.text.trim();
      return name && value !== undefined ? [{ model: name, score: value, setting: 'Vals AI harness' }] : [];
    });
    if (!rows.length) throw new Error('MATH-500 Vals rows missing');
    return rows;
  },
};
export default board;
