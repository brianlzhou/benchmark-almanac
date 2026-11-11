// Global-MMLU Lite on Kaggle Benchmarks (Cohere Labs), read through the helper in kaggle-game-arena.ts
// (Kaggle's documented public leaderboard endpoint). The board's "Average" task, accuracy over the 15
// languages as a fraction, is the score (0 to 100); the per-language and culturally sensitive or agnostic
// tasks are breakdowns.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'global-mmlu-lite',
  host: 'Kaggle',
  url: 'https://www.kaggle.com/benchmarks/cohere-labs/global-mmlu-lite',
  feed: kaggleFeed('cohere-labs', 'global-mmlu-lite'),
  terms: KAGGLE_TERMS,
  aliases: {
    'Command A': 'cohere-command-a',
  },
  fetch: () => kaggleRows('cohere-labs', 'global-mmlu-lite', 'Average', 100),
};
export default board;
