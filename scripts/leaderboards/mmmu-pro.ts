// MMMU-Pro (overall, the page's default sort) from the same leaderboard_data.json as MMMU, read through
// the helper in mmmu.ts. The overall is the page's own column. The page does not say which option count
// or vision setting each author-provided row used.
import type { Leaderboard } from './types.ts';
import { MMMU_ALIASES, MMMU_FEED, MMMU_TERMS, mmmuRows } from './mmmu.ts';

const board: Leaderboard = {
  benchmark: 'mmmu-pro',
  url: 'https://mmmu-benchmark.github.io/#leaderboard',
  feed: `${MMMU_FEED} (pro.overall)`,
  terms: MMMU_TERMS,
  aliases: MMMU_ALIASES,
  fetch: () => mmmuRows('pro'),
};
export default board;
