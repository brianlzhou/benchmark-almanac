// MineBench's public leaderboard API: published Elo rating, with confidence bounds and vote coverage.
// Cost is recorded cohort expenditure per finalized build, including recorded retries.
// Keep estimates flagged, time in seconds, and block averages as metrics. These are not output tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://minebench.ai/api/leaderboard';
interface Entry {
  slug: string; displayName: string; eloRating: number;
  benchmark?: { averageCostUsd?: number; costEstimated?: boolean; averageTimeMs?: number; averageBlocks?: number; blockSampleCount?: number; expectedBuildCount?: number };
  [key: string]: unknown;
}
const board: Leaderboard = {
  benchmark: 'minebench', url: 'https://minebench.ai/leaderboard', feed: FEED,
  terms: 'Public MineBench leaderboard API. Site terms apply; the almanac credits and links MineBench.',
  aliases: {
    'Claude 4.8 Opus':'claude-opus-4-8', 'Claude 4.7 Opus':'claude-opus-4-7',
    'Claude 4.6 Opus':'claude-opus-4-6', 'Claude 4.6 Sonnet':'claude-sonnet-4-6',
    'Z.AI GLM 5.3 Flash':'glm-5-3-flash', 'Z.AI GLM 5.3':'glm-5-3',
    'Z.AI GLM 5.2':'glm-5-2', 'Z.AI GLM 5.1':'glm-5-1',
    'Claude 4.5 Opus':'claude-opus-4-5', 'Claude 4.5 Sonnet':'claude-sonnet-4-5',
    'Z.AI GLM 5':'glm-5', 'Z.AI GLM 4.7':'glm-4-7',
  },
  async fetch() {
    const data = await fetchJson<{models: Entry[]}>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.models) {
      if (!r.displayName || !Number.isFinite(r.eloRating)) continue;
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(r)) if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      const b = r.benchmark;
      if (b) {
        for (const [k, v] of Object.entries(b)) if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
        if (b.averageTimeMs != null) metrics.secondsPerBuild = b.averageTimeMs / 1000;
        if (typeof b.costEstimated === 'boolean') metrics.costEstimated = Number(b.costEstimated);
      }
      rows.push({ model: r.displayName, score: r.eloRating,
        ...(typeof b?.averageCostUsd === 'number' ? {cost: b.averageCostUsd} : {}), metrics });
    }
    if (!rows.length) throw new Error('MineBench returned no rated models');
    return rows;
  },
};
export default board;
