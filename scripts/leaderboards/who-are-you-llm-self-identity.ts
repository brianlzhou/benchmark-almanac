// Who Are You? LLM Self-Identity (Kaggle Benchmarks, by jgonn6235): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'who-are-you-llm-self-identity',
  url: 'https://www.kaggle.com/benchmarks/jgonn6235/who-are-you-llm-self-identity',
  feed: kaggleFeed('jgonn6235', 'who-are-you-llm-self-identity'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('jgonn6235', 'who-are-you-llm-self-identity', "(Overall)", 100),
};
export default board;
