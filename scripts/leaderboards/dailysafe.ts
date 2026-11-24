// DailySafe (Wuhan University, Ant Group, Tsinghua University, and collaborators):
// multi-turn multimodal everyday safety and helpfulness across 195 cases.
// Source verbatim uncertainty definition (https://dailysafe-bench.github.io/, Table 1 caption):
//   "Source: Table 1 in the DailySafe paper. Scores are mean ± sample standard deviation across three runs. Higher is better."
// Because the published spread is sample SD (not standard error), headline SR sample SD is kept under SKIP key `srStd`
// rather than `metrics.stderr`.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://dailysafe-bench.github.io/';

function parseMeanSd(cell: string): { mean: number; sd?: number } | null {
  const clean = cell.replace(/<[^>]+>/g, '').trim();
  const m = clean.match(/^(-?\d+(?:\.\d+)?)\s*(?:±|\+\/-)\s*(-?\d+(?:\.\d+)?)$/);
  if (m) return { mean: Number(m[1]), sd: Number(m[2]) };
  const n = Number(clean);
  return Number.isFinite(n) ? { mean: n } : null;
}

const board: Leaderboard = {
  benchmark: 'dailysafe',
  url: PAGE,
  feed: PAGE,
  terms: 'Public project leaderboard table on GitHub Pages (Table 1 of arXiv:2611.26298).',
  static: 'paper',
  stats: {
    helpfulnessRate: {
      name: 'Helpfulness rate',
      unit: '%',
      better: 'higher',
      note: 'Mean helpfulness rate across three runs on 195 multi-turn everyday cases.',
    },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`DailySafe page: ${res.status}`);
    const html = await res.text();
    const tableMatch = html.match(/<table[^>]*id=["']?main-table["']?[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) throw new Error('DailySafe: main-table not found');

    const rows: LeaderboardRow[] = [];
    for (const tbody of tableMatch[1].matchAll(/<tbody[^>]*>([\s\S]*?)<\/tbody>/gi)) {
      const block = tbody[1];
      const isOpen = /open-weight/i.test(block);
      const isClosed = /proprietary/i.test(block);
      for (const tr of block.matchAll(/<tr(?:\s+[^>]*)?>([\s\S]*?)<\/tr>/gi)) {
        if (/class=["']?model-family["']?/i.test(tr[0])) continue;
        const thMatch = tr[1].match(/<th[^>]*>([\s\S]*?)<\/th>/i);
        const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
        if (!thMatch || tds.length < 2) continue;
        const model = thMatch[1].replace(/<[^>]+>/g, '').trim();
        const sr = parseMeanSd(tds[0]);
        const hr = parseMeanSd(tds[1]);
        if (!model || !sr) continue;

        const metrics: Record<string, number> = {};
        if (typeof sr.sd === 'number' && Number.isFinite(sr.sd)) metrics.srStd = sr.sd;
        if (hr && Number.isFinite(hr.mean)) metrics.helpfulnessRate = hr.mean;

        const row: LeaderboardRow = {
          model,
          score: sr.mean,
          trials: 3,
          metrics,
        };
        if (isOpen) row.open = true;
        else if (isClosed) row.open = false;
        rows.push(row);
      }
    }
    if (rows.length === 0) throw new Error('DailySafe: parsed zero rows');
    return rows;
  },
};

export default board;
