// GPQA Main on HELM Capabilities (Stanford CRFM). The score is "GPQA - COT correct" in the Accuracy table of
// core_scenarios.json, times 100. HELM's run specs name subset=gpqa_main, zero-shot with chain of thought.
// Read through helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'capabilities', group: 'core_scenarios', table: 'Accuracy', column: 'GPQA - COT correct', scale: 100 };

const board: Leaderboard = {
  benchmark: 'gpqa-main',
  host: 'Stanford HELM',
  url: 'https://crfm.stanford.edu/helm/capabilities/latest/#/leaderboard/gpqa',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
