// AlGhafa (native Arabic multiple-choice tasks, accuracy) on the Open Arabic LLM Leaderboard v2 (OALL). The
// board's AlGhafa column: the Space's score for this task in each model's lighteval results file, times 100.
// Read through the shared helper in open-arabic-llm-leaderboard-v2.ts, which explains the files, the newest-
// run rule and the model names.
import type { Leaderboard } from './types.ts';
import { OALL_ALIASES, OALL_TERMS, OALL_URL, oallFeed, oallRows } from './open-arabic-llm-leaderboard-v2.ts';

const board: Leaderboard = {
  benchmark: 'alghafa',
  url: OALL_URL,
  feed: oallFeed('AlGhafa'),
  terms: OALL_TERMS,
  aliases: OALL_ALIASES,
  fetch: () => oallRows('AlGhafa'),
};
export default board;
