// Sinhala Language Proficiency & Linguistic Mastery (Kaggle Benchmarks, by nadewdamruwan): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'sinhala-language-proficiency-linguistic-mastery',
  url: 'https://www.kaggle.com/benchmarks/nadewdamruwan/sinhala-language-proficiency-and-linguistic-mastery',
  feed: kaggleFeed('nadewdamruwan', 'sinhala-language-proficiency-and-linguistic-mastery'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('nadewdamruwan', 'sinhala-language-proficiency-and-linguistic-mastery', "(Overall)", 1),
};
export default board;
