// Prompt Injection Robustness (Chaitanya Jamble) on Kaggle Benchmarks (chaitanyajamble), read through Kaggle's documented public leaderboard endpoint with the
// helper in kaggle-game-arena.ts. The board's "prompt_injection_robustness" task is the score.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'prompt-injection-robustness-jamble',
  url: 'https://www.kaggle.com/benchmarks/chaitanyajamble/prompt-injection-robustness',
  feed: kaggleFeed('chaitanyajamble', 'prompt-injection-robustness'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('chaitanyajamble', 'prompt-injection-robustness', "prompt_injection_robustness", 1),
};
export default board;
