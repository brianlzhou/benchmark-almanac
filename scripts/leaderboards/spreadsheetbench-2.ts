// SpreadsheetBench 2. The SpreadsheetBench site's v2 tab reads data/leaderboard-v2-full.json: per system
// its scaffold, score (task accuracy, 0 to 100), subscores and date. Model runs use SWE-agent as the
// scaffold, which becomes the harness. Read through spreadsheetRows in spreadsheetbench.ts.
import type { Leaderboard } from './types.ts';
import { SSB_PAGE, SSB_TERMS, spreadsheetRows, ssbFeed } from './spreadsheetbench.ts';

const board: Leaderboard = {
  benchmark: 'spreadsheetbench-2',
  url: SSB_PAGE,
  feed: ssbFeed('leaderboard-v2-full.json'),
  terms: SSB_TERMS,
  aliases: {},
  fetch: () => spreadsheetRows('leaderboard-v2-full.json'),
};
export default board;
