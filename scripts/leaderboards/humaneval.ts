// HumanEval (EvalPlus). The EvalPlus leaderboard also scores the original 164 HumanEval tasks with their
// original tests: "humaneval" in results.json, greedy pass@1. Keep the prompt mode and training-data availability.
import type { Leaderboard } from './types.ts';
import { EVALPLUS_ALIASES, EVALPLUS_FEED, EVALPLUS_PAGE, EVALPLUS_STATS, EVALPLUS_TERMS } from './humaneval-plus.ts';

import { evalplusRows } from '../lib/boards/evalplus.ts';

const board: Leaderboard = {
  benchmark: 'humaneval',
  host: 'EvalPlus',
  url: EVALPLUS_PAGE,
  feed: `${EVALPLUS_FEED} (pass@1 humaneval)`,
  terms: EVALPLUS_TERMS,
  aliases: EVALPLUS_ALIASES,
  stats: EVALPLUS_STATS,
  fetch: () => evalplusRows('humaneval'),
};
export default board;
