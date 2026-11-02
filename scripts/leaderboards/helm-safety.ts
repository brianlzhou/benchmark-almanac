// HELM Safety (Stanford CRFM). The headline is "Mean score" in the Accuracy table of safety_scenarios.json, the
// mean of HarmBench, SimpleSafetyTests, BBQ, Anthropic Red Team and XSTest scores, times 100. Read through
// helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'safety', group: 'safety_scenarios', table: 'Accuracy', column: 'Mean score', scale: 100 };

const board: Leaderboard = {
  benchmark: 'helm-safety',
  url: 'https://crfm.stanford.edu/helm/safety/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
