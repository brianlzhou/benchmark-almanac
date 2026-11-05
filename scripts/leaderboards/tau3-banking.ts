// τ³-Banking: the banking_knowledge domain of τ³-bench (release 1.0.x), ranked by pass^1 on the site's
// "τ³-Banking" tab. Scores from before the 1.0.1 grading fixes (July 2026) were re-graded by Sierra, and
// every current submission reports 1.0.1. The reader lives in tau2-bench.ts.
// The domain's pass^2 to pass^4 are kept as metrics ("pass2".."pass4", %, as on the τ²-bench tab), and its
// Avg Cost (US dollars per task) as the cost, when the submission reports them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ALIASES, TERMS, loadTau, row } from './tau2-bench.ts';

const board: Leaderboard = {
  benchmark: 'tau3-banking',
  url: 'https://taubench.com/leaderboard?benchmark=knowledge',
  feed: 'https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions/manifest.json (submissions)',
  terms: TERMS,
  aliases: ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const s of await loadTau('submissions')) {
      const d = s.results.banking_knowledge;
      const score = d?.pass_1;
      if (typeof score !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const k of [2, 3, 4] as const) {
        const v = d?.[`pass_${k}`];
        if (typeof v === 'number') metrics[`pass${k}`] = v;
      }
      rows.push({
        ...row(s, score),
        cost: typeof d?.cost === 'number' && d.cost > 0 ? d.cost : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
