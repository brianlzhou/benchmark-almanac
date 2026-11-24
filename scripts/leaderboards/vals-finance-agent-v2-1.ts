// Vals Finance Agent v2.1 (the current Finance Agent page, a revision of v2 with a new judge jury) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_STATS, VALS_TERMS, VALS_LATENCY_CHART, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'fabv2-1';
const TASKS = {
  general_qualitative_analysis: 'general_qualitative_analysis',
  general_quantitative_analysis: 'general_quantitative_analysis',
  market_analysis: 'market_analysis',
  comparables: 'comparables',
  precedents: 'precedents',
  adjustments: 'adjustments',
  earnings_analysis: 'earnings_analysis',
  disclosure_analysis: 'disclosure_analysis',
  financial_modeling: 'financial_modeling',
  all_pass: 'all_pass',
};

const board: Leaderboard = {
  benchmark: 'vals-finance-agent-v2-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  parts: {
    general_qualitative_analysis: { name: 'General qualitative analysis', group: 'Task' },
    general_quantitative_analysis: { name: 'General quantitative analysis', group: 'Task' },
    market_analysis: { name: 'Market analysis', group: 'Task' },
    comparables: { name: 'Comparables', group: 'Task' },
    precedents: { name: 'Precedents', group: 'Task' },
    adjustments: { name: 'Adjustments', group: 'Task' },
    earnings_analysis: { name: 'Earnings analysis', group: 'Task' },
    disclosure_analysis: { name: 'Disclosure analysis', group: 'Task' },
    financial_modeling: { name: 'Financial modeling', group: 'Task' },
  },
  stats: {
    ...VALS_STATS,
    all_pass: { name: 'All-pass rate', unit: '%', better: 'higher' },
  },
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG, { tasks: TASKS }),
};
export default board;
