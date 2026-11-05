// Kaggle Game Arena, heads-up poker (Kaggle and Google DeepMind). The board ranks models by "Mean BB/100", the big
// blinds won per 100 hands, so the score is that number (it can be negative). Its "Avg. Tokens/Turn" and
// "Avg. Cost/Turn" are per move, so they are kept as metrics.tokensPerTurn and costPerTurn (US dollars; the
// board shows cents), not as tokens or cost. Read through the helper in kaggle-game-arena.ts (Kaggle's
// documented public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-poker',
  url: 'https://www.kaggle.com/benchmarks/kaggle/poker-heads-up',
  feed: kaggleFeed('kaggle', 'poker-heads-up'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'poker-heads-up', 'Mean BB/100', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, costPerTurn: { task: 'Avg. Cost/Turn', scale: 0.01 } }),
};
export default board;
