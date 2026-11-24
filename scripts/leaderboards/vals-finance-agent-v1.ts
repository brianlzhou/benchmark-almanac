// Vals Finance Agent v1 (the original 537-question board, frozen by Vals) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'finance_agent_v1';
const TASKS = {
  simple_retrieval_quantitative: 'simple_retrieval_quantitative',
  simple_retrieval_qualitative: 'simple_retrieval_qualitative',
  complex_retrieval: 'complex_retrieval',
  numerical_reasoning: 'numerical_reasoning',
  financial_modeling: 'financial_modeling',
  market_analysis: 'market_analysis',
  beat_or_miss: 'beat_or_miss',
  trends: 'trends',
  adjustments: 'adjustments',
};

const board: Leaderboard = {
  benchmark: 'vals-finance-agent-v1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  parts: {
    simple_retrieval_quantitative: { name: 'Simple retrieval (quantitative)', group: 'Task' },
    simple_retrieval_qualitative: { name: 'Simple retrieval (qualitative)', group: 'Task' },
    complex_retrieval: { name: 'Complex retrieval', group: 'Task' },
    numerical_reasoning: { name: 'Numerical reasoning', group: 'Task' },
    financial_modeling: { name: 'Financial modeling projections', group: 'Task' },
    market_analysis: { name: 'Market analysis', group: 'Task' },
    beat_or_miss: { name: 'Beat or miss', group: 'Task' },
    trends: { name: 'Trends', group: 'Task' },
    adjustments: { name: 'Adjustments', group: 'Task' },
  },
  stats: VALS_STATS,
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG, { tasks: TASKS }),
};
export default board;
