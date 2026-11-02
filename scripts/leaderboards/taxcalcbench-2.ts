// TaxCalcBench v2 (Column Tax), Tax Year 2025 edition: 50 returns from realistic PDF inputs, federal plus
// California, Illinois, New York and Virginia returns. Read from the same taxcalcbench.ai data file as the
// v1 board through tcbRows in taxcalcbench.ts; the score is "Correct returns (strict)".
import type { Leaderboard } from './types.ts';
import { TCB_ALIASES, TCB_FEED, TCB_PAGE, TCB_TERMS, tcbRows } from './taxcalcbench.ts';

const board: Leaderboard = {
  benchmark: 'taxcalcbench-2',
  url: TCB_PAGE,
  feed: `${TCB_FEED} (edition v2, strict)`,
  terms: TCB_TERMS,
  aliases: TCB_ALIASES,
  fetch: () => tcbRows('v2'),
};
export default board;
