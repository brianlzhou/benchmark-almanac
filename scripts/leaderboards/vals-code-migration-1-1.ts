// Vals Code Migration v1.1 (same tasks as v1, Pi agent harness, revised hidden tests) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'code-migration-v1-1';

const board: Leaderboard = {
  benchmark: 'vals-code-migration-1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  parts: { cli: { name: 'CLI', group: 'Task' }, cobol: { name: 'COBOL', group: 'Task' } },
  stats: {
    ...VALS_STATS,
    code_quality: { name: 'Code quality', unit: 'score', better: 'higher', note: 'Judge score on a 1 to 5 scale.' },
  },
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG, { tasks: { cli: 'cli', cobol: 'cobol', code_quality: 'code_quality' } }),
};
export default board;
