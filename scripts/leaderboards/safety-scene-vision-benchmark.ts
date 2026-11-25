// Safety-Scene Vision Benchmark (Kaggle Benchmarks, by clivinjohn): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'safety-scene-vision-benchmark',
  url: 'https://www.kaggle.com/benchmarks/clivinjohn/safety-scene-vision-benchmark',
  feed: kaggleFeed('clivinjohn', 'safety-scene-vision-benchmark'),
  terms: KAGGLE_TERMS,
  parts: {
    hazardSpotting: 'Hazard spotting',
    hazardSpottingLeading: 'Hazard spotting (leading)',
  },
  fetch: () => kaggleRowsWithBounds('clivinjohn', 'safety-scene-vision-benchmark', "(Overall)", 1, {
    hazardSpotting: { task: 'safety-scene-hazard-spotting', interval: true },
    hazardSpottingLeading: { task: 'safety-scene-hazard-spotting-leading', interval: true },
  }),
};
export default board;
