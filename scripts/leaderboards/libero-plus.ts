// LIBERO-Plus (robustness of vision-language-action policies). The makers keep the leaderboard as a markdown
// table under "LIBERO-Plus Benchmark Leaderboard" in the sylvestf/LIBERO-plus README: task success rate under
// seven perturbation types and "Total" (0 to 100), which is the score. Variants of one policy trained another
// way ("OpenVLA-OFT_w", "OpenVLA-OFT+ (Ours)") stay unmatched, since the registry holds only the released
// policies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdRecords, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'sylvestf/LIBERO-plus';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'libero-plus',
  url: `https://github.com/${REPO}#-libero-plus-benchmark-leaderboard`,
  feed: `${FEED} (LIBERO-Plus Benchmark Leaderboard, Total)`,
  terms: 'README table in the sylvestf/LIBERO-plus GitHub repository, which states no license; scores are cited to the LIBERO-Plus authors.',
  aliases: {
    'π₀': 'pi0',
    'π₀-Fast': 'pi0-fast',
  },
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => /LIBERO-Plus Benchmark Leaderboard/.test(x.heading));
    if (!t) throw new Error('LIBERO-Plus table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of mdRecords(t)) {
      const score = Number(r.Total);
      if (r.Model && Number.isFinite(score)) rows.push({ model: r.Model, score });
    }
    return rows;
  },
};
export default board;
