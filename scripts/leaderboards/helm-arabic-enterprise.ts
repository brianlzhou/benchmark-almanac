// HELM Arabic Enterprise (Stanford CRFM). The headline is "Mean score" in the Accuracy table of the project's
// arabic_scenarios.json, the mean over the six enterprise tasks, times 100. Read through helmRows in
// helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'arabic-enterprise', group: 'arabic_scenarios', table: 'Accuracy', column: 'Mean score', scale: 100, scenarioParts: 'scaled' };

const board: Leaderboard = {
  benchmark: 'helm-arabic-enterprise',
  url: 'https://crfm.stanford.edu/helm/arabic-enterprise/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  parts: {
    'Article Generation - Score': { name: 'Article Generation', group: 'Scenario' },
    'Finance MCQA - EM': { name: 'Finance MCQA', group: 'Scenario' },
    'Finance Bool - EM': { name: 'Finance Bool', group: 'Scenario' },
    'Finance Calculation - Accuracy': { name: 'Finance Calculation', group: 'Scenario' },
    'Legal Openbook QA - Score': { name: 'Legal Openbook QA', group: 'Scenario' },
    'Legal Closedbook QA - Score': { name: 'Legal Closedbook QA', group: 'Scenario' },
  },
  stats: { latency: { name: 'Observed inference time', unit: 'seconds', better: 'lower' } },
  fetch: () => helmRows(TABLE),
};
export default board;
