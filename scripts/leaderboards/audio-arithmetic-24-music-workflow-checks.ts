// Audio Arithmetic: 24 Music Workflow Checks (Kaggle Benchmarks, by levittliwenye): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'audio-arithmetic-24-music-workflow-checks',
  url: 'https://www.kaggle.com/benchmarks/levittliwenye/audio-arithmetic-24-music-workflow-checks',
  feed: kaggleFeed('levittliwenye', 'audio-arithmetic-24-music-workflow-checks'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('levittliwenye', 'audio-arithmetic-24-music-workflow-checks', "(Overall)", 100),
};
export default board;
