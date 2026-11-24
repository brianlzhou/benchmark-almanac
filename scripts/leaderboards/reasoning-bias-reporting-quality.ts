// Reasoning-Bias-Reporting-Quality (Kaggle Benchmarks, by gayathriarvind): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'reasoning-bias-reporting-quality',
  url: 'https://www.kaggle.com/benchmarks/gayathriarvind/reasoning-bias-reporting-quality',
  feed: kaggleFeed('gayathriarvind', 'reasoning-bias-reporting-quality'),
  terms: KAGGLE_TERMS,
  parts: {
    overgeneralizationR1: 'Overgeneralization detection (R1)',
    badCausalChainR2: 'Bad causal chain (R2)',
    unpromptedCritiqueR3: 'Unprompted critique (R3)',
    unpromptedCritiqueR4: 'Unprompted critique (R4)',
    unpromptedCritiqueR5: 'Unprompted critique (R5)',
    unpromptedCritiqueR6: 'Unprompted critique (R6)',
    unpromptedCritiqueR7: 'Unprompted critique (R7)',
    unpromptedCritiqueR8: 'Unprompted critique (R8)',
    unpromptedCritiqueR9: 'Unprompted critique (R9)',
    unpromptedCritiqueR10: 'Unprompted critique (R10)',
  },
  fetch: () => kaggleRowsWithBounds('gayathriarvind', 'reasoning-bias-reporting-quality', "(Overall)", 1, {
    overgeneralizationR1: { task: 'Overgeneralization_Detection_r1', interval: true },
    badCausalChainR2: { task: 'BadCausalChain_r2', interval: true },
    unpromptedCritiqueR3: { task: 'unprompted_critique_r3', interval: true },
    unpromptedCritiqueR4: { task: 'unprompted_critique_r4', interval: true },
    unpromptedCritiqueR5: { task: 'unprompted_critique_r5', interval: true },
    unpromptedCritiqueR6: { task: 'unprompted_critique_r6', interval: true },
    unpromptedCritiqueR7: { task: 'unprompted_critique_r7', interval: true },
    unpromptedCritiqueR8: { task: 'unprompted_critique_r8', interval: true },
    unpromptedCritiqueR9: { task: 'unprompted_critique_r9', interval: true },
    unpromptedCritiqueR10: { task: 'unprompted_critique_r10', interval: true },
  }),
};
export default board;
