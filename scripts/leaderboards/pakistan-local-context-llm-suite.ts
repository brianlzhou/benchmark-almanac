// Pakistan Local Context LLM Suite (Kaggle Benchmarks, by toobaamunirr): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'pakistan-local-context-llm-suite',
  url: 'https://www.kaggle.com/benchmarks/toobaamunirr/pakistan-local-context-llm-suite',
  feed: kaggleFeed('toobaamunirr', 'pakistan-local-context-llm-suite'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('toobaamunirr', 'pakistan-local-context-llm-suite', "(Overall)", 100),
};
export default board;
