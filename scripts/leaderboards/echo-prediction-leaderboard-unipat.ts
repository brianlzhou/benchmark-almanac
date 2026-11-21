// Echo prediction leaderboard (UniPat AI). echo.unipat.ai is a Vite app whose leaderboard view reads its
// own JSON endpoint, /api/v2/rankings?category=Overall: per model the Elo score from pairwise battles on
// resolved forecasting questions, the margin, battle and resolved counts. The Overall Elo is the score.
// The "Market" row (Polymarket prices, provider "system") is a human baseline and is skipped.
// The ± the page prints after the score (eloMargin, in Elo points) sets the lower and upper score bounds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://echo.unipat.ai/api/v2/rankings?category=Overall';

interface Ranking {
  modelName: string;
  provider?: string;
  eloScore?: number;
  eloMargin?: number;
  battles?: number;
  resolvedCount?: number;
  rankUp?: number;
  rankDown?: number;
}

const board: Leaderboard = {
  benchmark: 'echo-prediction-leaderboard-unipat',
  url: 'https://echo.unipat.ai/leaderboard',
  feed: `${FEED} (eloScore)`,
  terms: 'Public JSON endpoint behind the Echo leaderboard page; echo.unipat.ai has no robots.txt (unipat.ai allows all paths) and publishes no terms of use.',
  aliases: {
    // Grok 4.20 was in beta when Echo added it (2026-03-16)
    'Grok-4.2-beta': 'grok-4-20',
  },
  stats: { battles: { name: 'Battles', unit: 'count' }, resolvedCount: { name: 'Resolved cases', unit: 'count' } },
  async fetch() {
    const res = await fetchJson<{ success: boolean; data: Ranking[] }>(FEED);
    if (!res.success || !Array.isArray(res.data)) throw new Error('unexpected Echo rankings response');
    const rows: LeaderboardRow[] = [];
    for (const r of res.data) {
      if (r.provider !== 'official' || typeof r.eloScore !== 'number') continue;
      const margin = typeof r.eloMargin === 'number' && r.eloMargin >= 0 ? r.eloMargin : undefined;
      const metrics: Record<string, number> = {};
      for (const key of ['battles','resolvedCount'] as const) {
        const value = r[key];
        if (typeof value === 'number') metrics[key] = value;
      }
      if (typeof r.rankUp === 'number') metrics.rankLow = r.rankUp;
      if (typeof r.rankDown === 'number') metrics.rankHigh = r.rankDown;
      rows.push({model: r.modelName, score: r.eloScore, metrics,
        low: margin === undefined ? undefined : r.eloScore-margin, high: margin === undefined ? undefined : r.eloScore+margin});
    }
    return rows;
  },
};
export default board;
