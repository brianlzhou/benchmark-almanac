// ToRR on HELM (Stanford CRFM). The headline is "Mean score" in the Performance table of table_scenarios.json,
// the mean over the table datasets, times 100. The Robustness table is a breakdown. Read through helmRows in
// helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'torr', group: 'table_scenarios', table: 'Performance', column: 'Mean score', scale: 100 };

const board: Leaderboard = {
  benchmark: 'torr',
  url: 'https://crfm.stanford.edu/helm/torr/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
