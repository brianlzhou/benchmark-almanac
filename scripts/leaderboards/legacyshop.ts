// LegacyShop (Kaggle Benchmarks, by iseoluwaolowogoke): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'legacyshop',
  url: 'https://www.kaggle.com/benchmarks/iseoluwaolowogoke/legacyshop-can-an-ai-maintain-a-real-codebase',
  feed: kaggleFeed('iseoluwaolowogoke', 'legacyshop-can-an-ai-maintain-a-real-codebase'),
  terms: KAGGLE_TERMS,
  parts: {
    repoBugfix: 'Repository bugfix',
    memoryReasoning: 'Memory reasoning',
    knowingWhenToAsk: 'Knowing when to ask',
    complexityAnalysis: 'Complexity analysis',
  },
  fetch: () => kaggleRowsWithBounds('iseoluwaolowogoke', 'legacyshop-can-an-ai-maintain-a-real-codebase', "(Overall)", 1, {
    repoBugfix: { task: 'repo_bugfix_v2', interval: true },
    memoryReasoning: { task: 'memory_reasoning_v4', interval: true },
    knowingWhenToAsk: { task: 'knowing_when_to_ask_repo_v4', interval: true },
    complexityAnalysis: { task: 'complexity_analysis_repo_v5', interval: true },
  }),
};
export default board;
