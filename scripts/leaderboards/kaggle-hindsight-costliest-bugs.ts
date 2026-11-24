// Hindsight: Catching History's Costliest Bugs (Kaggle Benchmarks, by fuddle): read through the helper in
// kaggle-game-arena.ts, Kaggle's documented public leaderboard endpoint. The headline is the "(Overall)"
// accuracy share scaled to a percentage, with all four task splits kept as parts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const OWNER = 'fuddle';
const SLUG = 'hindsight-catching-historys-costliest-bugs';

const board: Leaderboard = {
  benchmark: 'kaggle-hindsight-costliest-bugs',
  url: `https://www.kaggle.com/benchmarks/${OWNER}/${SLUG}`,
  feed: kaggleFeed(OWNER, SLUG),
  terms: KAGGLE_TERMS,
  parts: {
    historical: { name: 'Historical', group: 'Variant' },
    disguised: { name: 'Disguised', group: 'Variant' },
    disguisedContext: { name: 'Disguised with context', group: 'Variant' },
    fixed: { name: 'Fixed control', group: 'Variant' },
  },
  fetch: () =>
    kaggleRowsWithBounds(OWNER, SLUG, '(Overall)', 100, {
      historical: { task: 'hindsight-historical', scale: 100 },
      disguised: { task: 'hindsight-disguised', scale: 100 },
      disguisedContext: { task: 'hindsight-disguised-context', scale: 100 },
      fixed: { task: 'hindsight-fixed', scale: 100 },
    }),
};
export default board;
