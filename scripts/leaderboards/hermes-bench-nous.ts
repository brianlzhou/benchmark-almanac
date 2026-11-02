// Hermes Bench (Nous Research), one of the four suites in the Hermes Index. The Hermes leaderboard's eval
// column holds each model's Hermes Bench pass@1 (0 to 100) and its cost per task, read through hermesRows
// in hermes-index-nous.ts.
import type { Leaderboard } from './types.ts';
import { HERMES_ALIASES, HERMES_PAGE, HERMES_TERMS, hermesRows } from './hermes-index-nous.ts';

const board: Leaderboard = {
  benchmark: 'hermes-bench-nous',
  url: HERMES_PAGE,
  feed: `${HERMES_PAGE} (server-rendered table, eval column)`,
  terms: HERMES_TERMS,
  aliases: HERMES_ALIASES,
  fetch: () => hermesRows('eval'),
};
export default board;
