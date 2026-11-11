// MathIF (instruction following in math reasoning). The makers keep the leaderboard as three markdown tables
// in the TingchenFu/MathIF README, one per model size group, each sorted by HAcc: hard accuracy, the share of
// problems where the model follows every constraint (0 to 100). HAcc is the score. SAcc (soft accuracy) and
// correctness with constraints remain separate secondary metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'TingchenFu/MathIF';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'mathif',
  url: `https://github.com/${REPO}#leaderboard`,
  feed: `${FEED} (Leaderboard tables, HAcc)`,
  terms: 'README tables in the TingchenFu/MathIF GitHub repository, which states no license; scores are cited to the MathIF authors.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED)).filter((x) => /Models$/.test(x.heading) && x.head.includes('HAcc'))) {
      const iScore = t.head.indexOf('HAcc');
      for (const r of t.rows) {
        const score = Number(r[iScore]);
        if (r[0] && Number.isFinite(score)) {
          const metrics: Record<string, number> = {};
          for (let i = 1; i < t.head.length; i++) {
            if (i === iScore || !r[i]?.trim()) continue;
            const value = Number(r[i]);
            if (Number.isFinite(value)) metrics[t.head[i]] = value;
          }
          rows.push({ model: r[0], score, metrics });
        }
      }
    }
    if (!rows.length) throw new Error('MathIF tables not found');
    return rows;
  },
};
export default board;
