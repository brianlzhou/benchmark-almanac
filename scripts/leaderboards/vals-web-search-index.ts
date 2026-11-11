// Vals Web Search Index (one row per model and search tool; the tool is kept as the harness) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'web_search';

const board: Leaderboard = {
  benchmark: 'vals-web-search-index',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  chart: {title:'Search score vs. cost',x:{key:'cost',label:'Cost per task',unit:'$',better:'lower'},y:{key:'score',label:'Score',unit:'%',better:'higher'}},
  fetch: () => valsRows(SLUG, { score: 'Score', cost: 'Cost/Task', harness: 'Search Tool' }),
};
export default board;
