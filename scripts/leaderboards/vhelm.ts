// VHELM (Stanford CRFM). The project publishes run suites, not releases. The newest suite's core_scenarios.json
// Accuracy table gives "Mean win rate", relative to the models on the board, times 100. Read through helmRows
// in helm-capabilities.ts.
import { helmWithScenarioTokens } from '../lib/boards/helm-cov6.ts';
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'vhelm', kind: 'runs', group: 'core_scenarios', table: 'Accuracy', column: 'Mean win rate', scale: 100 };

const board: Leaderboard = {
  benchmark: 'vhelm',
  url: 'https://crfm.stanford.edu/helm/vhelm/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmWithScenarioTokens(TABLE),
};
export default board;
