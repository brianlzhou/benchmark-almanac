// CritPt v2 (research-level physics challenges). The makers keep the v2 leaderboard as a markdown table under
// "Leaderboard (v2)" in the CritPt-Benchmark/CritPt README: "Challenge Accuracy", the mean accuracy over 5
// runs of the 70 test challenges (0 to 100), which is the score. The v1 board on critpt.com is the critpt
// record and is not read here.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'CritPt-Benchmark/CritPt';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'critpt-v2',
  url: `https://github.com/${REPO}#leaderboard-v2`,
  feed: `${FEED} (Leaderboard (v2), Challenge Accuracy)`,
  terms: 'README table in the CritPt-Benchmark/CritPt GitHub repository, which states no license; scores are cited to the CritPt authors.',
  aliases: {},
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => /^Leaderboard \(v2\)$/.test(x.heading));
    if (!t) throw new Error('CritPt v2 table not found');
    const iScore = t.head.findIndex((h) => /^Challenge Accuracy/.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const score = Number(r[iScore]);
      if (r[0] && Number.isFinite(score)) rows.push({ model: r[0], score });
    }
    return rows;
  },
};
export default board;
