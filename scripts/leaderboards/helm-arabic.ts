// HELM Arabic (Stanford CRFM). The headline is "Mean score" in the Accuracy table of arabic_scenarios.json, the
// mean over the seven Arabic benchmarks, times 100. Read through helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'arabic', group: 'arabic_scenarios', table: 'Accuracy', column: 'Mean score', scale: 100 };

const board: Leaderboard = {
  benchmark: 'helm-arabic',
  url: 'https://crfm.stanford.edu/helm/arabic/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
