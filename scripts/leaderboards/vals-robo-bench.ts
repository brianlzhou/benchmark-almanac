// Vals Robo Bench reports estimated API cost for the entire 24-task run, explicitly labeled as run cost.
// Rows also carry latency (and, where the chart data has them, output tokens and the 95% interval) from the
// page's chart data, which the board's scatter can plot against latency.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'robo_bench';

const board: Leaderboard = {
  benchmark: 'vals-robo-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  costPer: 'run',
  chart: {title:'Accuracy vs. whole-run API cost',note:'Estimated API cost covers all 24 tasks, not one task.',x:{key:'cost',label:'API cost for 24-task run',unit:'$',better:'lower'},y:{key:'score',label:'Accuracy',unit:'%',better:'higher'}},
  aliases: VALS_ALIASES,
  fetch: async () => (await valsRows(SLUG, { cost: 'Est. API cost' })).map(r=>({...r,metrics:{...r.metrics,...(r.cost!==undefined?{cost:r.cost}:{}),tasks:24}})),
};
export default board;
