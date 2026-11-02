// AHELM (audio HELM, Stanford CRFM). The newest run suite's audio_scenarios.json Accuracy table gives "Mean win
// rate", relative to the models on the board, times 100. Read through helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'audio', kind: 'runs', group: 'audio_scenarios', table: 'Accuracy', column: 'Mean win rate', scale: 100 };

const board: Leaderboard = {
  benchmark: 'ahelm',
  url: 'https://crfm.stanford.edu/helm/audio/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
