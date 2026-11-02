// Arabic MMLU-HT (MMLU translated into Arabic by humans, accuracy) on the Open Arabic LLM Leaderboard v2
// (OALL). The board's ArbMMLU-HT column: the Space's score for this task in each model's lighteval results
// file, times 100. Read through the shared helper in open-arabic-llm-leaderboard-v2.ts, which explains the
// files, the newest-run rule and the model names.
import type { Leaderboard } from './types.ts';
import { OALL_ALIASES, OALL_TERMS, OALL_URL, oallFeed, oallRows } from './open-arabic-llm-leaderboard-v2.ts';

const board: Leaderboard = {
  benchmark: 'arabic-mmlu-ht',
  url: OALL_URL,
  feed: oallFeed('ArbMMLU-HT'),
  terms: OALL_TERMS,
  aliases: OALL_ALIASES,
  fetch: () => oallRows('ArbMMLU-HT'),
};
export default board;
