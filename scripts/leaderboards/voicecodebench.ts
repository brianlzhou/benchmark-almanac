// VoiceCodeBench by besimple.ai, run by Vals AI (headline TSR, task success rate) on vals.ai, read through the helper in vals-index.ts.
// Rows also carry latency (and, where the chart data has them, output tokens and the 95% interval) from the
// page's chart data, which the board's scatter can plot against latency.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'voice-code-bench';

const board: Leaderboard = {
  benchmark: 'voicecodebench',
  host: 'Vals AI',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: {
    ...VALS_LATENCY_CHART,
    title: 'TSR against latency',
    note: 'The Vals scatter chart with its x axis switched from Cost to Latency: mean time per task against task success rate, on a log scale.',
    y: { ...VALS_LATENCY_CHART.y, label: 'Task success rate (TSR)' },
  },
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG, { score: 'TSR', cost: 'STT Cost / Task' }),
};
export default board;
