// FairScreen: Testing LLM Hiring Decisions (Kaggle Benchmarks, by maksimsilchenko): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'fairscreen-testing-llm-hiring-decisions',
  url: 'https://www.kaggle.com/benchmarks/maksimsilchenko/fairscreen-testing-llm-hiring-decisions',
  feed: kaggleFeed('maksimsilchenko', 'fairscreen-testing-llm-hiring-decisions'),
  terms: KAGGLE_TERMS,
  parts: {
    direct: 'Direct',
    fairnessInstruction: 'Fairness instruction',
    structured: 'Structured',
    evidenceSufficiency: 'Evidence sufficiency',
  },
  fetch: () => kaggleRowsWithBounds('maksimsilchenko', 'fairscreen-testing-llm-hiring-decisions', "(Overall)", 100, {
    direct: { task: 'fairscreen-direct', scale: 100, interval: true },
    fairnessInstruction: { task: 'fairscreen-fairness-instruction', scale: 100, interval: true },
    structured: { task: 'fairscreen-structured', scale: 100, interval: true },
    evidenceSufficiency: { task: 'fairscreen-evidence-sufficiency', scale: 100, interval: true },
  }),
};
export default board;
