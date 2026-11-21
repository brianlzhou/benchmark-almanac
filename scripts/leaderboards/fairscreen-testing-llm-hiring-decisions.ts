// FairScreen: Testing LLM Hiring Decisions (Kaggle Benchmarks, by maksimsilchenko): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'fairscreen-testing-llm-hiring-decisions',
  url: 'https://www.kaggle.com/benchmarks/maksimsilchenko/fairscreen-testing-llm-hiring-decisions',
  feed: kaggleFeed('maksimsilchenko', 'fairscreen-testing-llm-hiring-decisions'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('maksimsilchenko', 'fairscreen-testing-llm-hiring-decisions', "(Overall)", 100),
};
export default board;
