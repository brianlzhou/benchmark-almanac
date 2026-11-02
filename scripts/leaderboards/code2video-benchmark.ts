// Code2Video Benchmark on Kaggle Benchmarks (HeyGen). The "ELO-Ranking" task, an Elo rating from a trained
// pairwise judge over 168 product-video briefs, is the score. "Raw Score" is a breakdown. Read through the helper
// in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'code2video-benchmark',
  url: 'https://www.kaggle.com/benchmarks/heygen/code2video',
  feed: kaggleFeed('heygen', 'code2video'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('heygen', 'code2video', 'ELO-Ranking', 1),
};
export default board;
