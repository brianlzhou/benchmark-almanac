// VHELM (Stanford CRFM). The project publishes run suites, not releases. The newest suite's core_scenarios.json
// Accuracy table gives "Mean win rate", relative to the models on the board, times 100. Read through helmRows
// in helm-capabilities.ts.
import { helmWithScenarioTokens } from '../lib/boards/helm-scenario-tokens.ts';
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'vhelm', kind: 'runs', group: 'core_scenarios', table: 'Accuracy', column: 'Mean win rate', scale: 100 };
const OUTPUT_TOKEN_SCENARIOS = ['VQAv2', 'VizWiz', 'Flickr30k', 'POPE', 'MM-Star (Perception subsets)', 'BLINK (Perception subsets)', 'MMMU', 'Exams-V', 'GQA', 'MathVista', 'Seed Bench', 'Mementos', 'RealWorldQA', 'MM-Star (Reasoning subsets)', 'BLINK (Reasoning subsets)', 'A-OKVQA', 'MME', 'Vibe Eval', 'MM-Star (Knowledge subsets)', 'BLINK (Knowledge subsets)', 'PAIRS', 'VQAv2 (AAE)', 'A-OKVQA (AAE)', 'Crossmodal 3600', 'FairFace', 'Bingo (fairness)', 'MM-SafetyBench', 'Hateful Memes', 'Unicorn', 'Bingo', 'A-OKVQA (chinese)', 'A-OKVQA (hindi)', 'A-OKVQA (spanish)', 'A-OKVQA (swahili)', 'Bingo (multilinguality)'];

const board: Leaderboard = {
  benchmark: 'vhelm',
  url: 'https://crfm.stanford.edu/helm/vhelm/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  stats: Object.fromEntries(OUTPUT_TOKEN_SCENARIOS.map(name => [`${name} output tokens`, { name: `${name} output tokens`, unit: 'tokens' }])),
  fetch: () => helmWithScenarioTokens(TABLE),
};
export default board;
