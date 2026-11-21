// EvalCheck-LLM (Kaggle Benchmarks, by akash2268): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'evalcheck-llm',
  url: 'https://www.kaggle.com/benchmarks/akash2268/evalcheck-llm',
  feed: kaggleFeed('akash2268', 'evalcheck-llm'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('akash2268', 'evalcheck-llm', "(Overall)", 100),
};
export default board;
