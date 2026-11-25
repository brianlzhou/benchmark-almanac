// VeriGap (Kaggle Benchmarks, by archie40004): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'verigap',
  url: 'https://www.kaggle.com/benchmarks/archie40004/verigap',
  feed: kaggleFeed('archie40004', 'verigap'),
  terms: KAGGLE_TERMS,
  parts: {
    validity: 'Validity',
    mutation: 'Mutation',
    codegen: 'Code generation',
  },
  fetch: () => kaggleRowsWithBounds('archie40004', 'verigap', "(Overall)", 1, {
    validity: { task: 'verigap-validity' },
    mutation: { task: 'verigap-mutation' },
    codegen: { task: 'verigap-codegen' },
  }),
};
export default board;
