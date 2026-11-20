// Small Model Agent Bench (Kaggle Benchmarks, by cacinie): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'small-model-agent-bench',
  url: 'https://www.kaggle.com/benchmarks/cacinie/smab-small-model-agent-bench',
  feed: kaggleFeed('cacinie', 'smab-small-model-agent-bench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('cacinie', 'smab-small-model-agent-bench', "(Overall)", 100),
};
export default board;
