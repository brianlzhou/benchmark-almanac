// OlympiadBench (Tsinghua and partners, ACL 2024). The makers keep the leaderboard as two markdown tables in
// the OpenBMB/OlympiadBench README: the full multimodal benchmark and the text-only problems. The almanac's
// record is the full benchmark, so the "Experiment with full benchmark" table's "Avg." column (accuracy over
// math and physics, 0 to 100) is the score. The table dates from mid 2024, so rows are dated 2024-06-01 and the
// resolver picks the snapshots current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'OpenBMB/OlympiadBench';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'olympiadbench',
  url: `https://github.com/${REPO}#leaderboard`,
  feed: `${FEED} (Experiment with full benchmark, Avg.)`,
  terms: 'README table in the OpenBMB/OlympiadBench GitHub repository, which is MIT-licensed.',
  aliases: {
    'Gemini-Pro-Vision': 'gemini-1-0-pro-vision',
    'LLaVA-NeXT-34B': 'llava-v1-6-34b',
    'Claude3-Opus': 'claude-3-opus',
  },
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => /full benchmark/i.test(x.heading));
    if (!t) throw new Error('full benchmark table not found');
    const iAvg = t.head.findIndex((h) => /^avg/i.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const score = Number(r[iAvg]);
      if (r[0] && Number.isFinite(score)) rows.push({ model: r[0], score, date: '2024-06-01' });
    }
    return rows;
  },
};
export default board;
