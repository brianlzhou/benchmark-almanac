// MBPP+ (EvalPlus), pass@1 from the EvalPlus leaderboard's results.json, read through the helper in
// humaneval-plus.ts.
import type { Leaderboard } from './types.ts';
import { EVALPLUS_ALIASES, EVALPLUS_FEED, EVALPLUS_PAGE, EVALPLUS_TERMS, evalplusRows } from './humaneval-plus.ts';

const board: Leaderboard = {
  benchmark: 'mbpp-plus',
  url: EVALPLUS_PAGE,
  feed: `${EVALPLUS_FEED} (pass@1 mbpp+)`,
  terms: EVALPLUS_TERMS,
  aliases: EVALPLUS_ALIASES,
  fetch: () => evalplusRows('mbpp+'),
};
export default board;
