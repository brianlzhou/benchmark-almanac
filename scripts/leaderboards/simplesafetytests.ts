// SimpleSafetyTests on HELM Safety (Stanford CRFM). The score is the "LM Evaluated Safety score" in
// simple_safety_tests.json, the judged share of safe responses, times 100. Read through helmRows in
// helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'safety', group: 'simple_safety_tests', column: 'LM Evaluated Safety score', scale: 100 };

const board: Leaderboard = {
  benchmark: 'simplesafetytests',
  host: 'Stanford HELM',
  url: 'https://crfm.stanford.edu/helm/safety/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
