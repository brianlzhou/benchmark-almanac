// Vals Legal Index on vals.ai, read through the helper in vals-index.ts.
// Rows also carry latency (and, where the chart data has them, output tokens and the 95% interval) from the
// page's chart data, which the board's scatter can plot against latency.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'legal_index';
const TASKS = {
  business_commercial: 'business_commercial',
  civil_negligence: 'civil_negligence',
  other_civil: 'other_civil',
  real_estate: 'real_estate',
  labor_employment: 'labor_employment',
  wills_estates_trusts: 'wills_estates_trusts',
  family: 'family',
  criminal: 'criminal',
  tax_agent_bench: 'tax_agent_bench',
};

const board: Leaderboard = {
  benchmark: 'vals-legal-index',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  parts: {
    business_commercial: { name: 'Business and commercial', group: 'Practice area' },
    civil_negligence: { name: 'Civil negligence', group: 'Practice area' },
    other_civil: { name: 'Other civil', group: 'Practice area' },
    real_estate: { name: 'Real estate', group: 'Practice area' },
    labor_employment: { name: 'Labor and employment', group: 'Practice area' },
    wills_estates_trusts: { name: 'Wills, estates and trusts', group: 'Practice area' },
    family: { name: 'Family', group: 'Practice area' },
    criminal: { name: 'Criminal', group: 'Practice area' },
    tax_agent_bench: { name: 'Tax Agent', group: 'Practice area' },
  },
  stats: VALS_STATS,
  chart: VALS_LATENCY_CHART,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG, { tasks: TASKS }),
};
export default board;
