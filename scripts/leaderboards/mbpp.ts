// MBPP (EvalPlus). The EvalPlus leaderboard also scores its MBPP+ task set with the original MBPP tests: "mbpp"
// in results.json, greedy pass@1. That set is a cleaned subset of the original test split, so the rows say so.
// Keep the prompt mode and training-data availability from the EvalPlus results.
import type { Leaderboard } from './types.ts';
import { EVALPLUS_ALIASES, EVALPLUS_FEED, EVALPLUS_PAGE, EVALPLUS_TERMS } from './humaneval-plus.ts';

import { evalplusRows } from '../lib/boards/evalplus.ts';

const board: Leaderboard = {
  benchmark: 'mbpp',
  host: 'EvalPlus',
  url: EVALPLUS_PAGE,
  feed: `${EVALPLUS_FEED} (pass@1 mbpp)`,
  terms: EVALPLUS_TERMS,
  aliases: EVALPLUS_ALIASES,
  stats: { activeParams: { name: 'Active parameters', unit: 'billions' } },
  fetch: async () => (await evalplusRows('mbpp')).map((r) => ({ ...r, setting: ['EvalPlus subset, original tests', r.setting].filter(Boolean).join(', ') })),
};
export default board;
