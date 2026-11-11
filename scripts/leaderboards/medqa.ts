// MedQA on HELM Lite (Stanford CRFM). The score is "MedQA - EM" in the Accuracy table of core_scenarios.json,
// exact-match accuracy on the English USMLE questions, times 100. Read through helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'lite', group: 'core_scenarios', table: 'Accuracy', column: 'MedQA - EM', scale: 100 };

const board: Leaderboard = {
  benchmark: 'medqa',
  host: 'Stanford HELM',
  url: 'https://crfm.stanford.edu/helm/lite/latest/#/leaderboard/med_qa',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
