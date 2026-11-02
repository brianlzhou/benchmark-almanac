// ALRAGE (Arabic retrieval-augmented answers, scored by an LLM judge) on the Open Arabic LLM Leaderboard v2
// (OALL). The board's ALRAGE column: the Space's score for this task in each model's lighteval results file,
// times 100. Read through the shared helper in open-arabic-llm-leaderboard-v2.ts, which explains the files,
// the newest-run rule and the model names.
import type { Leaderboard } from './types.ts';
import { OALL_ALIASES, OALL_TERMS, OALL_URL, oallFeed, oallRows } from './open-arabic-llm-leaderboard-v2.ts';

const board: Leaderboard = {
  benchmark: 'alrage',
  url: OALL_URL,
  feed: oallFeed('ALRAGE'),
  terms: OALL_TERMS,
  aliases: OALL_ALIASES,
  fetch: () => oallRows('ALRAGE'),
};
export default board;
