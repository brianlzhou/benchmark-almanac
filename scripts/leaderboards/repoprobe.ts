// RepoProbe — Tencent Hunyuan repository-level code comprehension benchmark (ASE 2026).
// Reads Table 2 from arXiv:2608.04783 (20 evaluated frontier models: 13 closed-weight, 7 open-weight),
// reporting Overall Performance, Knowledge Score, Clarity Score, and Perfect Solve Rate (%).

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2608.04783';

const board: Leaderboard = {
  benchmark: 'repoprobe',
  feed: FEED,
  url: 'https://github.com/Tencent-Hunyuan/RepoProbe',
  terms: 'Public arXiv paper published by Tencent Hunyuan.',
  static: 'paper',
  aliases: {
    'Doubao-Seed-1.8': 'seed-1-8',
  },
  stats: {
    knowledge: { name: 'Knowledge score', unit: '%', better: 'higher' },
    clarity: { name: 'Clarity score', unit: '%', better: 'higher' },
    perfectSolve: { name: 'Perfect solve rate', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const tbl = paperTables(html)
      .map(grid)
      .find(
        (g) =>
          g.length >= 15 &&
          g[0].some((c) => /Overall Performance/i.test(c)) &&
          g[0].some((c) => /Perfect Solve Rate/i.test(c)),
      );
    if (!tbl) throw new Error('RepoProbe Table 2 not found in arXiv HTML');

    const rows: LeaderboardRow[] = [];
    for (const r of tbl.slice(1)) {
      if (r.length < 6) continue;
      const cat = r[0].trim();
      const model = r[1].trim();
      const score = num(r[2]);
      if (!model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const knowledge = num(r[3]);
      const clarity = num(r[4]);
      const perfectSolve = num(r[5]);
      if (knowledge !== undefined) metrics.knowledge = knowledge;
      if (clarity !== undefined) metrics.clarity = clarity;
      if (perfectSolve !== undefined) metrics.perfectSolve = perfectSolve;

      const row: LeaderboardRow = { model, score, metrics };
      if (/Closed-weight/i.test(cat)) row.open = false;
      else if (/Open-weight/i.test(cat)) row.open = true;
      rows.push(row);
    }

    return checked(rows, 18);
  },
};

export default board;
