// HELM Arabic (Stanford CRFM). The headline is "Mean score" in the Accuracy table of arabic_scenarios.json, the
// mean over the seven Arabic benchmarks, times 100. Read through helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'arabic', group: 'arabic_scenarios', table: 'Accuracy', column: 'Mean score', scale: 100, scenarioParts: 'scaled' };

const board: Leaderboard = {
  benchmark: 'helm-arabic',
  url: 'https://crfm.stanford.edu/helm/arabic/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  parts: {
    'AlGhafa - EM': { name: 'AlGhafa', group: 'Scenario' },
    'ArabicMMLU - EM': { name: 'ArabicMMLU', group: 'Scenario' },
    'Arabic EXAMS - EM': { name: 'Arabic EXAMS', group: 'Scenario' },
    'MadinahQA - EM': { name: 'MadinahQA', group: 'Scenario' },
    'AraTrust - EM': { name: 'AraTrust', group: 'Scenario' },
    'ALRAGE - Score': { name: 'ALRAGE', group: 'Scenario' },
    'Translated MMLU - EM': { name: 'Translated MMLU', group: 'Scenario' },
  },
  stats: { latency: { name: 'Observed inference time', unit: 'seconds', better: 'lower' } },
  fetch: () => helmRows(TABLE),
};
export default board;
