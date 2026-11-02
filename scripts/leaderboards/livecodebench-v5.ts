// LiveCodeBench v5 (release_v5: 880 problems published May 2023 to January 2025). The site now serves the v6
// file only, but v6 is v5 plus later problems, so the v5 problems keep their per-problem pass@1 in it. When
// v5 was current the page's default window ran from 2024-08-01 to 2025-02-01 (the "2408-2502" window labs
// cite for v5), and that window is the score here, read through the helper in livecodebench-v6.ts.
import type { Leaderboard } from './types.ts';
import { LCB_ALIASES, LCB_FEED, LCB_PAGE, LCB_TERMS, lcbRows } from './livecodebench-v6.ts';

const board: Leaderboard = {
  benchmark: 'livecodebench-v5',
  url: LCB_PAGE,
  feed: `${LCB_FEED} (problems from 2024-08-01 to 2025-02-01)`,
  terms: LCB_TERMS,
  aliases: LCB_ALIASES,
  fetch: () => lcbRows('2024-08-01', '2025-02-01'),
};
export default board;
