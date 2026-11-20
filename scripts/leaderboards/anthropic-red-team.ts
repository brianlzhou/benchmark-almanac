// Anthropic Red Team on HELM Safety (Stanford CRFM). The score is the "LM Evaluated Safety score" in
// anthropic_red_team.json, the judged safety of responses to 1,000 sampled red-team prompts, times 100. Read
// The same table gives evaluation counts, tokens and evaluator success rates.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'safety', group: 'anthropic_red_team', column: 'LM Evaluated Safety score', scale: 100 };

const board: Leaderboard = {
  benchmark: 'anthropic-red-team',
  host: 'Stanford HELM',
  url: 'https://crfm.stanford.edu/helm/safety/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE, true),
};
export default board;
