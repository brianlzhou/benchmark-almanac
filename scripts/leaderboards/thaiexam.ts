// ThaiExam on HELM (Stanford CRFM). The score is "ThaiExam - EM" in the Accuracy table of thai_scenarios.json,
// exact-match accuracy over all five exams, times 100. Read through helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'thaiexam', group: 'thai_scenarios', table: 'Accuracy', column: 'ThaiExam - EM', scale: 100 };

const board: Leaderboard = {
  benchmark: 'thaiexam',
  url: 'https://crfm.stanford.edu/helm/thaiexam/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
