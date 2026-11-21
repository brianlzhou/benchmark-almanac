// HELM Classic (Stanford CRFM), last release v0.4.0. The headline is "Mean win rate" in the Accuracy table of
// core_scenarios.json, relative to the models on the board, times 100. Read through helmRows in
// helm-capabilities.ts.
import { helmWithScenarioTokens } from '../lib/boards/helm-scenario-tokens.ts';
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'classic', group: 'core_scenarios', table: 'Accuracy', column: 'Mean win rate', scale: 100 };
const OUTPUT_TOKEN_SCENARIOS = ['MMLU', 'BoolQ', 'NarrativeQA', 'NaturalQuestions (closed-book)', 'NaturalQuestions (open-book)', 'QuAC', 'TruthfulQA', 'CNN/DailyMail', 'XSUM', 'IMDB', 'CivilComments', 'RAFT', 'HellaSwag', 'OpenbookQA', 'MS MARCO (regular)', 'MS MARCO (TREC)'];

const board: Leaderboard = {
  benchmark: 'helm-classic',
  url: 'https://crfm.stanford.edu/helm/classic/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  stats: Object.fromEntries(OUTPUT_TOKEN_SCENARIOS.map(name => [`${name} output tokens`, { name: `${name} output tokens`, unit: 'tokens' }])),
  fetch: () => helmWithScenarioTokens(TABLE),
};
export default board;
