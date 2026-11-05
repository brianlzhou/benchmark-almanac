// Vals CUA-bench (computer-use agents climbing game ladders) on vals.ai. Read through the helper in
// vals-index.ts. Its "Est. API cost" column is each model's estimated API total over all its published runs
// (a floor, priced from the run ledgers), kept as cost with costPer 'run'.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'cua_bench';

const board: Leaderboard = {
  benchmark: 'vals-cua-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  costPer: 'run',
  fetch: () => valsRows(SLUG, { cost: 'Est. API cost' }),
};
export default board;
