// Vals Time Horizon Index: KSP on vals.ai (headline Overall mission progress), read through the helper in
// vals-index.ts. The board's cost column, "Recorded API cost", is the recorded spend of a model's whole run, so
// it is kept with costPer 'run'.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'time_horizon_index';

const board: Leaderboard = {
  benchmark: 'vals-time-horizon-index-ksp',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  costPer: 'run',
  fetch: () => valsRows(SLUG, { score: 'Overall', cost: 'Recorded API cost' }),
};
export default board;
