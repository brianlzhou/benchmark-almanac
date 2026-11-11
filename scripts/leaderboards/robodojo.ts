// RoboDojo (simulation board). robodojo-benchmark.com/leaderboard is a client-rendered page whose data is
// the static file data/leaderboard.generated.json: `sim` lists each policy or model with team, score (the
// board's default metric) and success rate on the default "average" dimension. The score is that average
// score. Most entries are robot policies; only the ones in data/models.json match (GPT-6 Astra, pi0.5...).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://robodojo-benchmark.com/leaderboard';
const FEED = 'https://robodojo-benchmark.com/data/leaderboard.generated.json';

const board: Leaderboard = {
  benchmark: 'robodojo',
  url: PAGE,
  feed: `${FEED} (sim, average score)`,
  terms: 'Static JSON the board itself loads; robots.txt allows it (disallows only /internal/ and /login) and the RoboDojo repository is MIT-licensed.',
  async fetch() {
    const data = await fetchJson<{ sim: { model: string; score: number; successRate?: number; dimensions?: Record<string, {score?: number; successRate?: number}>; genSplits?: Record<string, {score?: number; successRate?: number}> }[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.sim ?? []) if (r.model && Number.isFinite(r.score)) {
      const metrics: Record<string, number> = {};
      if (Number.isFinite(r.successRate)) metrics.successRate = r.successRate!;
      for (const [key, value] of Object.entries({...r.dimensions, ...r.genSplits})) {
        if (Number.isFinite(value.score)) metrics[`${key}Score`] = value.score!;
        if (Number.isFinite(value.successRate)) metrics[`${key}SuccessRate`] = value.successRate!;
      }
      rows.push({ model: r.model.trim(), score: r.score, metrics });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} RoboDojo rows`);
    return rows;
  },
};
export default board;
