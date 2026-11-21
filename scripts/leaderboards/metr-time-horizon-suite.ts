// METR's March 2025 suite measures task length in human minutes at 50% agent success.
// The original paper used version 1.0. The chart's version 1.0 YAML contains its estimates and intervals.
import type { Leaderboard } from './types.ts';
import { METR_ALIASES, metrFeed, metrRows } from './metr-time-horizon.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = metrFeed('1_0');
const board: Leaderboard = {
  benchmark: 'metr-time-horizon-suite', url: 'https://metr.org/time-horizons/', feed,
  terms: 'METR publishes these chart downloads at https://metr.org/time-horizons/ and lists repository terms at https://github.com/METR/eval-analysis-public/blob/main/LICENSE.',
  aliases: METR_ALIASES,
  stats: { p80: { name: '80% success time horizon', unit: 'minutes', better: 'higher', note: 'Task length in human minutes at which the agent reaches 80% success.' } },
  async fetch() {
    const rows = await metrRows(feed);
    return checked(rows.map(row => ({...row, setting: 'Time Horizon 1.0', low: row.metrics?.ciLow, high: row.metrics?.ciHigh})), 31);
  },
};
export default board;
