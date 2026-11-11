// Vals IOI v1: the archived first version. Retain per-task costs, token prices and latency from the live table.
// The chart uses the site's latency axis, with seconds per test from the shared parser.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'ioi-v1';

const board: Leaderboard = {
  benchmark: 'vals-ioi',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: { ...VALS_ALIASES, 'Grok Code Fast': 'grok-code-fast-1' },
  chart: { title: 'Accuracy against latency', x: { key: 'latency', label: 'Latency per test', unit: 's', better: 'lower', log: true }, y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' } },
  fetch: () => valsRows(SLUG, { cost: null }),
};
export default board;
