// BigCodeBench-Hard (148 tasks), the default view of the BigCodeBench leaderboard, read from
// results-hard.json through the helper in bigcodebench.ts (mean of Complete and Instruct pass@1).
import type { Leaderboard } from './types.ts';
import { BCB_ALIASES, BCB_PAGE, BCB_TERMS, bcbFeed, bigcodebenchRows } from './bigcodebench.ts';

const board: Leaderboard = {
  benchmark: 'bigcodebench-hard',
  url: BCB_PAGE,
  feed: `${bcbFeed(true)} (mean of Complete and Instruct pass@1)`,
  terms: BCB_TERMS,
  aliases: BCB_ALIASES,
  fetch: () => bigcodebenchRows(true),
};
export default board;
