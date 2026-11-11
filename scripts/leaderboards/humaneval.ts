// HumanEval (EvalPlus). The EvalPlus leaderboard also scores the original 164 HumanEval tasks with their
// original tests: "humaneval" in results.json, greedy pass@1. Read through evalplusRows in humaneval-plus.ts.
import type { Leaderboard } from './types.ts';
import { EVALPLUS_ALIASES, EVALPLUS_FEED, EVALPLUS_PAGE, EVALPLUS_TERMS, evalplusRows } from './humaneval-plus.ts';

const board: Leaderboard = {
  benchmark: 'humaneval',
  host: 'EvalPlus',
  url: EVALPLUS_PAGE,
  feed: `${EVALPLUS_FEED} (pass@1 humaneval)`,
  terms: EVALPLUS_TERMS,
  aliases: EVALPLUS_ALIASES,
  fetch: () => evalplusRows('humaneval'),
};
export default board;
