// OCR Arena (built by Extend). ocrarena.ai/leaderboard is a Next.js page that loads its table from the site's
// own JSON endpoint, /api/leaderboard: per model an internal name, the display name the page shows (with the
// reasoning effort in parentheses), Elo from head-to-head human votes, wins, losses and latency. Elo is the
// score; the display name's parenthesis becomes the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://www.ocrarena.ai/leaderboard';
const FEED = 'https://www.ocrarena.ai/api/leaderboard';

interface Row {
  name: string;
  displayName?: string;
  elo: number;
}

const board: Leaderboard = {
  benchmark: 'ocr-arena',
  url: PAGE,
  feed: `${FEED} (elo)`,
  terms: 'Public JSON endpoint the leaderboard page itself calls; ocrarena.ai serves no robots.txt and publishes no terms.',
  aliases: {
    'Gemini 3': 'gemini-3-pro',
    'Mistral OCR v3': 'mistral-ocr-3',
  },
  async fetch() {
    const data = await fetchJson<{ leaderboard: Row[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.leaderboard ?? []) {
      const name = (r.displayName || r.name || '').trim();
      if (!name || !Number.isFinite(r.elo)) continue;
      const m = name.match(/^(.*?)\s*\(([^)]+)\)$/);
      const setting = m && !/preview/i.test(m[2]) ? m[2].toLowerCase() : undefined;
      rows.push({ model: m ? m[1] : name, setting, score: r.elo });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} OCR Arena rows`);
    return rows;
  },
};
export default board;
