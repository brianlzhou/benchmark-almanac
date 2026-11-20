// Creative Control: LLMs as a Film Crew (Kaggle Benchmarks, by chenlufried): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'creative-control-llms-as-a-film-crew',
  url: 'https://www.kaggle.com/benchmarks/chenlufried/creative-control-llms-as-a-film-crew',
  feed: kaggleFeed('chenlufried', 'creative-control-llms-as-a-film-crew'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('chenlufried', 'creative-control-llms-as-a-film-crew', "(Overall)", 1),
};
export default board;
