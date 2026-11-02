// AraTrust (trustworthiness questions, accuracy) on the Open Arabic LLM Leaderboard v2 (OALL). The board's
// AraTrust column: the Space's score for this task in each model's lighteval results file, times 100. Read
// through the shared helper in open-arabic-llm-leaderboard-v2.ts, which explains the files, the newest-run
// rule and the model names.
import type { Leaderboard } from './types.ts';
import { OALL_ALIASES, OALL_TERMS, OALL_URL, oallFeed, oallRows } from './open-arabic-llm-leaderboard-v2.ts';

const board: Leaderboard = {
  benchmark: 'aratrust',
  url: OALL_URL,
  feed: oallFeed('AraTrust'),
  terms: OALL_TERMS,
  aliases: OALL_ALIASES,
  fetch: () => oallRows('AraTrust'),
};
export default board;
