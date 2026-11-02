// EdgeBench (ByteDance Seed). The makers keep the leaderboard as markdown tables in the
// ByteDance-Seed/EdgeBench README. The "Full Benchmark (134 tasks)" table gives each model's score after 2 to
// 12 hours of agent interaction, with @12h, the end of the budget, in bold as the headline. @12h (the
// benchmark's own score, 0 to 100) is the score. The open-source subset and category tables are not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'ByteDance-Seed/EdgeBench';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'edgebench',
  url: `https://github.com/${REPO}#leaderboard`,
  feed: `${FEED} (Full Benchmark, @12h)`,
  terms: 'README table in the ByteDance-Seed/EdgeBench GitHub repository, which is Apache-2.0.',
  aliases: {
    'DS-V4-Pro': 'deepseek-v4-pro',
  },
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => /^Full Benchmark/.test(x.heading) && x.head.includes('@12h'));
    if (!t) throw new Error('EdgeBench full benchmark table not found');
    const iScore = t.head.indexOf('@12h');
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const score = Number(r[iScore]);
      if (r[0] && Number.isFinite(score)) rows.push({ model: r[0], score });
    }
    return rows;
  },
};
export default board;
