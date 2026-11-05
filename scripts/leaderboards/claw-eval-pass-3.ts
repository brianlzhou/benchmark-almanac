// Claw-Eval Pass^3 (a task counts only when all three trials pass), the board's default sort, read from the
// latest release through the helper in claw-eval.ts (benchmarkData pass_all_3_rate, already 0 to 100). Rows
// also carry the table's other columns in metrics, as claw-eval does: Pass^3 ("pass3", equal to the score),
// Pass@3 ("passAt3") and the parts completion, robustness and safety, in %.
import type { Leaderboard } from './types.ts';
import { CLAW_ALIASES, CLAW_FEED, CLAW_SITE, CLAW_TERMS, clawRows } from './claw-eval.ts';

const board: Leaderboard = {
  benchmark: 'claw-eval-pass-3',
  url: CLAW_SITE,
  feed: `${CLAW_FEED} (benchmarkData pass_all_3_rate)`,
  terms: CLAW_TERMS,
  aliases: CLAW_ALIASES,
  fetch: () => clawRows('general', 'pass_all_3_rate', 1, true),
};
export default board;
