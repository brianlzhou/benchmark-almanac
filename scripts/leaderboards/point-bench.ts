// Point-Bench, the static half of PointArena (pointarena.github.io). The page builds its Point-Bench table
// from data/point-bench2.csv: one row per model with five task columns and their Average (0 to 100), the
// score here. Rows carry no dates, so they take the paper's (arXiv 2505.09990, May 2025) and the resolver
// picks the snapshots current then. Point-Battle (Elo) and Point-Act are separate files and not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://pointarena.github.io/data/point-bench2.csv';
const PAPER_DATE = '2025-05-15';

const board: Leaderboard = {
  benchmark: 'point-bench',
  url: 'https://pointarena.github.io/',
  feed: FEED,
  terms: 'Static CSV on a GitHub Pages project site with no robots.txt and no terms; the scores are cited to the PointArena authors.',
  aliases: {
    'llava-onevision-qwen2-7b-ov-hf': 'llava-onevision-7b',
    'llava-onevision-qwen2-72b-ov-hf': 'llava-onevision-72b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const model = (r[''] ?? Object.values(r)[0] ?? '').trim();
      const score = Number(r.Average);
      if (!model || /^human$/i.test(model) || !Number.isFinite(score)) continue;
      rows.push({ model, score, date: PAPER_DATE });
    }
    if (!rows.length) throw new Error('no rows in point-bench2.csv');
    return rows;
  },
};
export default board;
