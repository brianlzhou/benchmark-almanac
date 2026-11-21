// BigLaw Bench measures legal work against attorney rubrics. Harvey’s answer-score chart gives the overall percentage.
// The article links two chart images. Their hashes protect the transcribed answer and source scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://www.harvey.ai/blog/introducing-biglaw-bench";

const board: Leaderboard = {
  benchmark: "biglaw-bench",
  url: "https://www.harvey.ai/blog/introducing-biglaw-bench",
  feed,
  terms: "Harvey publishes both charts in its launch article. Its robots.txt allows the article. No separate chart license is stated.",
  parts: { transactional: 'Transactional', litigation: 'Litigation' },
  async fetch() {
    const html = await fetchText(feed);
    const base = 'https://cdn.sanity.io/images/07s0r5r6/production/';
    const answer = '0fc9a9eb09ef535d7fce3167ebe074281f350898-2400x1350.png';
    const source = 'e66bd9a16f827110ae11c937e3960c0e25f8cb22-2400x1350.png';
    if (!html.includes(answer) || !html.includes(source)) throw new Error('BigLaw Bench chart references changed');
    await checkedImageRows(base + source, 'b35bfcdd71c638304164a1dee50bff11278150389cfddb0a6caa24fee1dabada', []);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return checkedImageRows(base + answer, '744dedc8e171ae8d92e210dc82569b1c520baa8b6f6816bc4d1e092153018006', [
      { model: 'Harvey', score: 74, metrics: { transactional: 76, litigation: 69, sourceScore: 68, transactionalSource: 76, litigationSource: 61 } },
      { model: 'GPT-4o', score: 61, metrics: { transactional: 64, litigation: 57, sourceScore: 24, transactionalSource: 21, litigationSource: 27 } },
      { model: 'Claude 3.5', score: 61, metrics: { transactional: 64, litigation: 58, sourceScore: 8, transactionalSource: 9, litigationSource: 7 } },
      { model: 'Gemini 1.5', score: 62, metrics: { transactional: 65, litigation: 59, sourceScore: 9, transactionalSource: 9, litigationSource: 7 } },
    ]);
  },
};

export default board;
