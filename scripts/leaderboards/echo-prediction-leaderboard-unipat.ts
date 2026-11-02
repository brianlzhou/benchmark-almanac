// Echo prediction leaderboard (UniPat AI). echo.unipat.ai is a Vite app whose leaderboard view reads its
// own JSON endpoint, /api/v2/rankings?category=Overall: per model the Elo score from pairwise battles on
// resolved forecasting questions, the margin, battle and resolved counts. The Overall Elo is the score.
// The "Market" row (Polymarket prices, provider "system") is a human baseline and is skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://echo.unipat.ai/api/v2/rankings?category=Overall';

interface Ranking {
  modelName: string;
  provider?: string;
  eloScore?: number;
}

const board: Leaderboard = {
  benchmark: 'echo-prediction-leaderboard-unipat',
  url: 'https://echo.unipat.ai/leaderboard',
  feed: `${FEED} (eloScore)`,
  terms: 'Public JSON endpoint behind the Echo leaderboard page; echo.unipat.ai has no robots.txt (unipat.ai allows all paths) and publishes no terms of use.',
  aliases: {
    'Grok-4.2-beta': 'grok-4-20-beta',
  },
  async fetch() {
    const res = await fetchJson<{ success: boolean; data: Ranking[] }>(FEED);
    if (!res.success || !Array.isArray(res.data)) throw new Error('unexpected Echo rankings response');
    const rows: LeaderboardRow[] = [];
    for (const r of res.data) {
      if (r.provider !== 'official' || typeof r.eloScore !== 'number') continue;
      rows.push({ model: r.modelName, score: r.eloScore });
    }
    return rows;
  },
};
export default board;
