// ThaiExam on HELM (Stanford CRFM). The score is "ThaiExam - EM" in the Accuracy table of thai_scenarios.json,
// exact-match accuracy over all five exams, times 100. Read through helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_DETAIL_STATS, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'thaiexam', group: 'thai_scenarios', table: 'Accuracy', column: 'ThaiExam - EM', scale: 100, scenarioParts: 'scaled' };

const board: Leaderboard = {
  benchmark: 'thaiexam',
  url: 'https://crfm.stanford.edu/helm/thaiexam/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  parts: {
    'ONET - EM': { name: 'ONET', group: 'Exam' },
    'IC - EM': { name: 'IC', group: 'Exam' },
    'TGAT - EM': { name: 'TGAT', group: 'Exam' },
    'TPAT-1 - EM': { name: 'TPAT-1', group: 'Exam' },
    'A-Level - EM': { name: 'A-Level', group: 'Exam' },
  },
  stats: HELM_DETAIL_STATS,
  fetch: () => helmRows(TABLE, true),
};
export default board;
