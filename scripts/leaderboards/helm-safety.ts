// HELM Safety (Stanford CRFM). The headline is "Mean score" in the Accuracy table of safety_scenarios.json, the
// mean of HarmBench, SimpleSafetyTests, BBQ, Anthropic Red Team and XSTest scores, times 100. Read through
// helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'safety', group: 'safety_scenarios', table: 'Accuracy', column: 'Mean score', scale: 100 };
const SCENARIOS = ['HarmBench', 'SimpleSafetyTests', 'BBQ', 'Anthropic Red Team', 'XSTest'];
const stats: NonNullable<Leaderboard['stats']> = {
  'BBQ metrics: BBQ - BBQ (ambiguous)': { name: 'BBQ ambiguous accuracy', unit: 'score', better: 'higher', note: 'Accuracy on ambiguous BBQ prompts from 0 to 1.' },
  'BBQ metrics: BBQ - BBQ (unambiguous)': { name: 'BBQ unambiguous accuracy', unit: 'score', better: 'higher', note: 'Accuracy on unambiguous BBQ prompts from 0 to 1.' },
  ...Object.fromEntries(SCENARIOS.flatMap((s) => [
    [`General information: ${s} - truncated`, { name: `${s} truncated fraction`, unit: 'score', better: 'lower' as const }],
    [`General information: ${s} - # prompt tokens`, { name: `${s} prompt tokens`, unit: 'tokens' }],
    [`General information: ${s} - # output tokens`, { name: `${s} output tokens`, unit: 'tokens' }],
    [`Annotation: ${s} - Llama Annotator Success Rate`, { name: `${s} Llama annotator success rate`, unit: 'score', better: 'higher' as const }],
    [`Annotation: ${s} - GPT Annotator Success Rate`, { name: `${s} GPT annotator success rate`, unit: 'score', better: 'higher' as const }],
  ])),
};

const board: Leaderboard = {
  benchmark: 'helm-safety',
  url: 'https://crfm.stanford.edu/helm/safety/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  parts: {
    'HarmBench - LM Evaluated Safety score': { name: 'HarmBench', group: 'Scenario' },
    'SimpleSafetyTests - LM Evaluated Safety score': { name: 'SimpleSafetyTests', group: 'Scenario' },
    'BBQ - BBQ accuracy': { name: 'BBQ', group: 'Scenario' },
    'Anthropic Red Team - LM Evaluated Safety score': { name: 'Anthropic Red Team', group: 'Scenario' },
    'XSTest - LM Evaluated Safety score': { name: 'XSTest', group: 'Scenario' },
  },
  stats,
  fetch: () => helmRows(TABLE, true, board),
};
export default board;
