// ABLE (Agentic BAIM-LLM Evaluation) on SecureBio's AI Biology Benchmarks dashboard. The Benchmarks page's
// ABLE breakdown chart (plotly-spec able-breakdown-plot-div) carries "ABLE (Full): 23.8% [CI] (9 runs)" in each
// model's hover text: the score over all nine tasks, which is the score here. The separate "Tasks With
// Baselines Only" chart covers three tasks and is not read. Points flagged for too many refusals are
// skipped. The reader is shared with hpct-v2-securebio.ts.
import type { Leaderboard } from './types.ts';
import { SB_ALIASES, SB_PAGE, SB_TERMS, sbRows } from './hpct-v2-securebio.ts';

const board: Leaderboard = {
  benchmark: 'able-securebio',
  url: 'https://securebio.org/benchmarks/',
  feed: `${SB_PAGE} (plotly-spec able-breakdown-plot-div, hover "ABLE (Full)")`,
  terms: SB_TERMS,
  aliases: SB_ALIASES,
  fetch: () => sbRows(/^able-breakdown-plot-div\b/, 'ABLE (Full)'),
};
export default board;
