// Your LLM doesn't Know BOUNDARY!. (Kaggle Benchmarks, by trexbytes): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'your-llm-doesn-t-know-boundary',
  url: 'https://www.kaggle.com/benchmarks/trexbytes/your-llm-doesnt-know-boundary',
  feed: kaggleFeed('trexbytes', 'your-llm-doesnt-know-boundary'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('trexbytes', 'your-llm-doesnt-know-boundary', "(Overall)", 1),
};
export default board;
