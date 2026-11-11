// IFEval on HELM Capabilities (Stanford CRFM). The score is "IFEval - IFEval Strict Acc" in the Accuracy table of
// core_scenarios.json, times 100. HELM scores each prompt as the share of its instructions followed under the
// strict check, then averages over prompts. Labs more often report prompt-level strict accuracy, where a prompt
// counts only when every instruction is followed, so the rows carry that as their setting. Read through helmRows.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'capabilities', group: 'core_scenarios', table: 'Accuracy', column: 'IFEval - IFEval Strict Acc', scale: 100 };
const SETTING = 'strict, share of instructions followed';

const board: Leaderboard = {
  benchmark: 'ifeval',
  host: 'Stanford HELM',
  url: 'https://crfm.stanford.edu/helm/capabilities/latest/#/leaderboard/ifeval',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: async () => (await helmRows(TABLE)).map((r) => ({ ...r, setting: r.setting ? `${SETTING}, ${r.setting}` : SETTING })),
};
export default board;
