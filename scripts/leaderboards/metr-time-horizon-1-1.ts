// METR Time Horizon 1.1 (228 tasks, run in Inspect). metr.org/time-horizons/ offers its chart data as a
// YAML download, benchmark_results_1_1.yaml; the headline is each model's 50% time horizon in minutes
// (p50_horizon_length.estimate), with the agent scaffold as the harness. Read through metrRows in
// metr-time-horizon.ts (the 1.0 importer). METR stopped updating the page on 2026-09-08.
import type { Leaderboard } from './types.ts';
import { METR_ALIASES, METR_TERMS, metrFeed, metrRows } from './metr-time-horizon.ts';

const FEED = metrFeed('1_1');

const board: Leaderboard = {
  benchmark: 'metr-time-horizon-1-1',
  url: 'https://metr.org/time-horizons/',
  feed: FEED,
  terms: METR_TERMS,
  aliases: METR_ALIASES,
  fetch: () => metrRows(FEED),
};
export default board;
