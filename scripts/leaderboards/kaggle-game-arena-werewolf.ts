// Kaggle Game Arena, Werewolf (Kaggle and Google DeepMind). The board's headline is "Equilibrium Rating", a
// game-theoretic rating that sits near zero (about -0.06 to 0.001), so it is kept times 100 for the sync's
// two-decimal rounding. It ranks models within this board only. Its "Avg. Tokens/Turn" and "Avg. Cost/Turn"
// are per move, so they are metrics (tokensPerTurn, costPerTurn in US dollars), not tokens and cost. Read
// through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-werewolf',
  url: 'https://www.kaggle.com/benchmarks/kaggle/werewolf',
  feed: kaggleFeed('kaggle', 'werewolf'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () =>
    kaggleRows('kaggle', 'werewolf', 'Equilibrium Rating', 100, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, costPerTurn: { task: 'Avg. Cost/Turn' } }),
};
export default board;
