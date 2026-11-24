// ACCoRD (conceptual consistency), one part of the Conceptual Reasoning Index. Its score is the concord
// column of conceptualreasoning.ai's data/cri-scores.csv. Retain every reasoning-effort setting and its confidence interval, with the normalized concord value where supplied.
import type { Leaderboard } from './types.ts';
import { CRI_ALIASES, CRI_FEED, CRI_TERMS, criColumn } from './dtbench.ts';

const board: Leaderboard = {
  benchmark: 'accord-conceptual-consistency',
  url: 'https://conceptualreasoning.ai/',
  feed: `${CRI_FEED} (concord)`,
  terms: CRI_TERMS,
  aliases: CRI_ALIASES,
  stats: {
    concordNorm: { name: 'Normalized concord', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const rows = await criColumn('concord', { includeEfforts: true, ci: 'concord_ci', metrics: { concordNorm: 'concord_norm' } });
    return rows.map(row => ({ ...row, low: row.metrics?.ciLow, high: row.metrics?.ciHigh }));
  },
};
export default board;
