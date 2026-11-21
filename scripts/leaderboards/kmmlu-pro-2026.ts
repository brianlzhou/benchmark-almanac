// KMMLU-Pro 2026 tests Korean professional licensure knowledge across 14 licenses.
// Table 2 of the paper reports the KMMLU-Pro accuracy and passed-license count for named models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const FEED = 'https://arxiv.org/html/2507.08924';
const board: Leaderboard = {
  benchmark: 'kmmlu-pro-2026', url: 'https://arxiv.org/abs/2507.08924', feed: FEED,
  terms: 'The paper is available from arXiv. Cite the authors and follow the paper license.', static: 'paper',
  parts: { passedLicenses: { name: 'Passed KNPLs', group: 'License' } },
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, { table: 1, header: 'KMMLU-Pro', score: 2, width: 5, min: 10, factor: 1, metrics: { passedLicenses: 3 } });
  },
};
export default board;
