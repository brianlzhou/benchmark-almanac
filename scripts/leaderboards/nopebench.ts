// NoPeBench (Hong Kong Polytechnic University): obstacle avoidance and safe intent compliance for video world models.
// Reads Table 4 (arXiv:2611.27963) published as an HTML table in the official NoPeWorld GitHub README.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://github.com/yuhangdai427/NoPeWorld';
const FEED = 'https://raw.githubusercontent.com/yuhangdai427/NoPeWorld/main/README.md';

const MODES = ['Raw', 'NoPeWorld (Collision)', 'NoPeWorld (Prediction)'] as const;

const cleanCell = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&ndash;|&mdash;|&#8211;/gi, '-')
    .trim();

const board: Leaderboard = {
  benchmark: 'nopebench',
  url: PAGE,
  feed: FEED,
  terms: 'Public Apache-2.0 repository and paper Table 4 published by the NoPeWorld authors.',
  static: 'paper',
  stats: {
    task2Violations: {
      name: 'Task 2 obstacle violations',
      unit: '%',
      better: 'lower',
      note: 'Share of obstacle-facing camera trajectories that penetrate walls or obstacles.',
    },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`NoPeBench README: ${res.status}`);
    const md = await res.text();
    const tableMatch = md.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) throw new Error('NoPeBench: HTML table not found in README');
    const tbodyMatch = tableMatch[0].match(/<tbody[\s\S]*?<\/tbody>/i);
    if (!tbodyMatch) throw new Error('NoPeBench: tbody not found');

    const rows: LeaderboardRow[] = [];
    for (const tr of tbodyMatch[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => cleanCell(m[1]));
      if (cells.length < 7) continue;
      const model = cells[0];
      for (let i = 0; i < MODES.length; i++) {
        const viol = Number(cells[1 + i]);
        const overall = Number(cells[4 + i]);
        if (!Number.isFinite(overall)) continue;
        const metrics: Record<string, number> = {};
        if (Number.isFinite(viol)) metrics.task2Violations = viol;
        rows.push({
          model,
          setting: MODES[i],
          score: overall,
          metrics,
        });
      }
    }
    if (rows.length === 0) throw new Error('NoPeBench: parsed zero rows');
    return rows;
  },
};

export default board;
