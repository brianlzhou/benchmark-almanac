// τ³-bench (tau2-bench release 1.0.x, March 2026): current taubench.com submissions on the fixed airline
// and retail tasks plus telecom, ranked by Overall pass^1 as on the site's "τ²-bench" tab. Rows that
// report only banking_knowledge go to tau3-banking.ts. The reader lives in tau2-bench.ts. Each row also
// keeps the site's Overall pass^2 to pass^4 (metrics.pass2 to pass4) and the mean cost per task, through
// overallExtras.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ALIASES, TERMS, loadTau, overall, overallExtras, row } from './tau2-bench.ts';

const board: Leaderboard = {
  benchmark: 'tau3-bench',
  url: 'https://taubench.com/leaderboard?benchmark=core',
  feed: 'https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions/manifest.json (submissions)',
  terms: TERMS,
  aliases: ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const s of await loadTau('submissions')) {
      const score = overall(s);
      if (score !== null) rows.push({ ...row(s, score), ...overallExtras(s) });
    }
    return rows;
  },
};
export default board;
