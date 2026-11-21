// TAAROFBENCH measures whether language models follow Persian taarof politeness norms.
// The benchmark paper reports overall accuracy across 450 scenarios in its results text.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://arxiv.org/html/2509.01035';
const board: Leaderboard = { benchmark: 'taarofbench', static: 'paper', url: FEED, feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt. Results are attributed to the paper authors.',
  async fetch() {
    const source = await fetchText(FEED);
    const deep = source.match(/DeepSeek V3 achieves the highest overall accuracy \((\d+\.\d+)%\)/);
    const llama = source.match(/followed by Llama 3 \((\d+\.\d+)%\)/);
    if (!deep || !llama) throw new Error('Missing TAAROFBENCH overall accuracy results');
    const rows: LeaderboardRow[] = [
      { model: 'DeepSeek V3', score: Number(deep[1]) },
      { model: 'Llama 3', score: Number(llama[1]) },
    ];
    return rows;
  },
};
export default board;
