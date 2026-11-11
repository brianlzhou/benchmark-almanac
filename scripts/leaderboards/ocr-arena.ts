// OCR Arena (built by Extend). ocrarena.ai/leaderboard is a Next.js page that loads its table from the site's
// own JSON endpoint, /api/leaderboard: per model an internal name, the display name the page shows (with the
// reasoning effort in parentheses), Elo from head-to-head human votes, wins, losses and latency. Elo is the
// score; the display name's parenthesis becomes the setting. avgLatencyMs (the page's latency column), in
// seconds, is kept as metrics.latency, and winRate (0 to 100) and totalBattles as metrics.winRate and votes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://www.ocrarena.ai/leaderboard';
const FEED = 'https://www.ocrarena.ai/api/leaderboard';

interface Row {
  name: string;
  displayName?: string;
  elo: number;
  winRate?: number;
  totalBattles?: number;
  avgLatencyMs?: number;
  wins?: number;
  losses?: number;
}

const board: Leaderboard = {
  benchmark: 'ocr-arena',
  url: PAGE,
  feed: `${FEED} (elo)`,
  terms: 'Public JSON endpoint the leaderboard page itself calls; ocrarena.ai serves no robots.txt and publishes no terms.',
  aliases: {
    // "Gemini 3 Preview": the November 2025 Gemini 3 Pro preview
    'Gemini 3': 'gemini-3-pro',
  },
  async fetch() {
    const data = await fetchJson<{ leaderboard: Row[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.leaderboard ?? []) {
      const name = (r.displayName || r.name || '').trim();
      if (!name || !Number.isFinite(r.elo)) continue;
      const m = name.match(/^(.*?)\s*\(([^)]+)\)$/);
      const setting = m && !/preview/i.test(m[2]) ? m[2].toLowerCase() : undefined;
      const metrics: Record<string, number> = {};
      if (typeof r.avgLatencyMs === 'number' && r.avgLatencyMs > 0) metrics.latency = r.avgLatencyMs / 1000;
      if (typeof r.winRate === 'number') metrics.winRate = r.winRate;
      if (typeof r.totalBattles === 'number') metrics.votes = r.totalBattles;
      if (typeof r.wins === 'number') metrics.wins = r.wins;
      if (typeof r.losses === 'number') metrics.losses = r.losses;
      rows.push({ model: m ? m[1] : name, setting, score: r.elo, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} OCR Arena rows`);
    return rows;
  },
};
export default board;
