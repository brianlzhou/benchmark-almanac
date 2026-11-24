// Vals Poker Agent (headline TrueSkill rating, not a percentage) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'poker_agent';

const board: Leaderboard = {
  benchmark: 'vals-poker-agent',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: { latency: { name: 'Latency per hand', unit: 'seconds', better: 'lower' } },
  chart: {
    ...VALS_LATENCY_CHART,
    title: 'TrueSkill rating against latency',
    note: 'The Vals scatter chart with its x axis switched from Cost to Latency: mean time per hand against TrueSkill rating, on a log scale.',
    x: { ...VALS_LATENCY_CHART.x, label: 'Latency (mean per hand)' },
    y: { key: 'score', label: 'TrueSkill rating', better: 'higher' },
  },
  fetch: () => valsRows(SLUG, { score: 'TrueSkill Rating', cost: 'Cost / Hand' }),
};
export default board;
