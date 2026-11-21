// GeoGuessBench ranks models by average points per five-photo game. The site data file includes confidence intervals, cost and geographic breakdowns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/Nutlope/geoguessbench/main/site/src/data/results.json";

const board: Leaderboard = {
  benchmark: "geoguessbench-nutlope",
  url: "https://www.geoguessbench.com/#leaderboard",
  feed,
  terms: "Code is MIT. The maker credits individual photos under CC BY-SA 4.0 and gives no separate terms for scores. https://github.com/Nutlope/geoguessbench#license The feed host returns no robots.txt.",
  stats: {
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    countryAccuracy: { name: 'Country accuracy', unit: '%', better: 'higher' },
    failures: { name: 'Parse failures', unit: 'count' },
    bestGame: { name: 'Best game score', unit: 'score', better: 'higher', note: 'Highest points in a game, out of 25,000.' },
    medianKm: { name: 'Median distance in kilometers', better: 'lower' },
  },
  async fetch() {
    type Result = { name: string; mode: string; gameMean: number; gameCi: [number, number]; open: boolean; costPerGame: number;
      outTokMean: number; latencyMedianS: number; countryAcc: number; medianKm: number; parseFail: number; gameBest: number;
      byTier: Record<string, { gameMean: number }>; byRegion: Record<string, { mean: number }> };
    const data = await fetchJson<{ rows: Result[]; meta: { games: number } }>(feed);
    if (data.rows.length < 12) throw new Error('Incomplete GeoGuessBench results');
    board.parts = {};
    return data.rows.map(r => {
      if (!r.name || !Number.isFinite(r.gameMean) || !r.gameCi?.every(Number.isFinite)) throw new Error('Invalid game result');
      const metrics: Record<string, number> = { latency: r.latencyMedianS, countryAccuracy: r.countryAcc * 100, medianKm: r.medianKm, failures: r.parseFail, bestGame: r.gameBest };
      for (const [name, tier] of Object.entries(r.byTier)) {
        board.parts![name] = { name, group: 'Location type' };
        metrics[name] = tier.gameMean;
      }
      for (const [name, region] of Object.entries(r.byRegion)) {
        board.parts![name] = { name, group: 'Region', note: 'Mean points per photo, out of 5,000.' };
        metrics[name] = region.mean;
      }
      return { model: r.name, setting: r.mode, score: r.gameMean, low: r.gameCi[0], high: r.gameCi[1], open: r.open, trials: data.meta.games,
        cost: r.costPerGame, tokens: r.outTokMean * 5, metrics };
    });
  },
};
export default board;
