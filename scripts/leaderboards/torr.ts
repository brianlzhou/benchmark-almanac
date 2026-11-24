// ToRR on HELM (Stanford CRFM). The headline is "Mean score" in the Performance table of table_scenarios.json,
// the mean over the table datasets, times 100. The Robustness table is a breakdown. Read through helmRows in
// helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'torr', group: 'table_scenarios', table: 'Performance', column: 'Mean score', scale: 100, scenarioParts: 'scaled' };

const board: Leaderboard = {
  benchmark: 'torr',
  url: 'https://crfm.stanford.edu/helm/torr/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  parts: {
    'FinQA - Program Accuracy': { name: 'FinQA', group: 'Scenario' },
    'NumericNLG - ROUGE-L': { name: 'NumericNLG', group: 'Scenario' },
    'QTSumm - ROUGE-L': { name: 'QTSumm', group: 'Scenario' },
    'SciGen - ROUGE-L': { name: 'SciGen', group: 'Scenario' },
    'TabFact - Accuracy': { name: 'TabFact', group: 'Scenario' },
    'Tablebench Data Analysis - ROUGE-L': { name: 'TableBench data analysis', group: 'Scenario' },
    'Tablebench Fact Checking - ROUGE-L': { name: 'TableBench fact checking', group: 'Scenario' },
    'Tablebench Numerical Reasoning - ROUGE-L': { name: 'TableBench numerical reasoning', group: 'Scenario' },
    'Turl Col Type - Micro F1': { name: 'TURL column type', group: 'Scenario' },
    'WikiTableQuestions - F1 Strings': { name: 'WikiTableQuestions', group: 'Scenario' },
  },
  fetch: () => helmRows(TABLE),
};
export default board;
