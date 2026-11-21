// Base64Bench measures exact and near-exact encoding and decoding of varied strings.
// This importer reads the article's perfect reconstruction accuracy for the whole benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED = 'https://www.lesswrong.com/posts/5F6ncBfjh2Bxnm6CJ/base64bench-how-good-are-llms-at-base64-and-why-care-about';
const board: Leaderboard = {
  benchmark: 'base64bench', url: FEED, feed: FEED,
  terms: 'The article is publicly readable. Link and attribute the Base64Bench author and source.',
  static: 'paper',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    if (!/Claude 3\.7 Sonnet.*75\.9%.*73\.7%/s.test(text) || !/GPT-5.*65\.8%/s.test(text)) throw new Error('Base64Bench results missing');
    return checked([
      { model: 'Claude 3.7 Sonnet', score: 75.9, setting: 'no reasoning or tools; perfect reconstruction' },
      { model: 'Claude Sonnet 4', score: 73.7, setting: 'no reasoning or tools; perfect reconstruction' },
      { model: 'GPT-5', score: 65.8, setting: 'minimal reasoning; perfect reconstruction' },
    ]);
  },
};
export default board;
