// DesignArena Human Intelligence Index: composite human preference index aggregating blind pairwise votes across DesignArena categories.
// Scores represent how many times in 100 users would pick a model's work over Claude Opus 5.5 (anchored at 50).
// Intervals (low, high) are 95% Bradley-Terry confidence bounds computed as score +/- 1.96 * btStdErr (with btStdErr stored in metrics.stderr).
// Read through scripts/lib/boards/designarena.ts, which explains the feed, the effort settings and the terms.
import type { Leaderboard } from './types.ts';
import { DA_ALIASES, DA_TERMS, DA_STATS_FULL, daFeed, daRows, type DaBoard } from '../lib/boards/designarena.ts';

const BOARD: DaBoard = { arenaType: 'models', category: 'human-intelligence-index' };

const board: Leaderboard = {
  benchmark: 'designarena-human-intelligence-index',
  url: 'https://www.designarena.ai/leaderboard?section=overall&board=human-intelligence-index',
  feed: daFeed(BOARD),
  terms: DA_TERMS,
  aliases: DA_ALIASES,
  stats: {
    winRate: DA_STATS_FULL.winRate,
    wins: DA_STATS_FULL.wins,
    losses: DA_STATS_FULL.losses,
    battles: DA_STATS_FULL.battles,
  },
  async fetch() {
    const rows = await daRows(BOARD);
    for (const row of rows) {
      if (row.metrics && 'ratingStdErr' in row.metrics) {
        row.metrics.stderr = row.metrics.ratingStdErr;
        delete row.metrics.ratingStdErr;
      }
    }
    return rows;
  },
};
export default board;
