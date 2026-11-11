// ACCoRD (conceptual consistency), one part of the Conceptual Reasoning Index. Its score is the concord
// column of conceptualreasoning.ai's data/cri-scores.csv. Retain every reasoning-effort setting and its confidence interval.
import type { Leaderboard } from './types.ts';
import { CRI_ALIASES, CRI_FEED, CRI_TERMS, criColumn } from './dtbench.ts';

const board: Leaderboard = {
  benchmark: 'accord-conceptual-consistency',
  url: 'https://conceptualreasoning.ai/',
  feed: `${CRI_FEED} (concord)`,
  terms: CRI_TERMS,
  aliases: CRI_ALIASES,
  fetch: () => criColumn('concord', { includeEfforts: true, ci: 'concord_ci' }),
};
export default board;
