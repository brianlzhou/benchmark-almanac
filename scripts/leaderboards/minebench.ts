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
  stats: {
    eloRating: { name: 'Elo rating', unit: 'elo', better: 'higher' }, ratingDeviation: { name: 'Rating deviation', unit: 'rating', better: 'lower' }, rankScore: { name: 'Rank score', unit: 'score', better: 'higher' }, ci95: { name: '95% confidence interval', unit: 'score' }, confidence: { name: 'Confidence', unit: '%', better: 'higher' }, rankDelta24h: { name: 'Rank change in 24 hours', unit: 'count' }, shownCount: { name: 'Shown prompts', unit: 'count' }, winCount: { name: 'Wins', unit: 'count' }, lossCount: { name: 'Losses', unit: 'count' }, drawCount: { name: 'Draws', unit: 'count' }, bothBadCount: { name: 'Both-bad votes', unit: 'count' }, coveredPrompts: { name: 'Covered prompts', unit: 'count' }, activePrompts: { name: 'Active prompts', unit: 'count' }, qualityFloorScore: { name: 'Quality floor score', unit: 'score', better: 'higher' }, meanScore: { name: 'Mean score', unit: 'score', better: 'higher' }, scoreVariance: { name: 'Score variance', unit: 'score' }, scoreSpread: { name: 'Score spread', unit: 'score' }, consistency: { name: 'Consistency', unit: '%', better: 'higher' }, sampledPrompts: { name: 'Sampled prompts', unit: 'count' }, sampledVotes: { name: 'Sampled votes', unit: 'count' }, averageBlocks: { name: 'Average blocks', unit: 'count', better: 'lower' }, blockSampleCount: { name: 'Block sample count', unit: 'count' }, expectedBuildCount: { name: 'Expected builds', unit: 'count' }, averageCostUsd: { name: 'Average cost', unit: 'usd', better: 'lower' }, averageTimeMs: { name: 'Average build time', unit: 'ms', better: 'lower' }, secondsPerBuild: { name: 'Seconds per build', unit: 'seconds', better: 'lower' }, pairCoverageScore: { name: 'Pair coverage score', unit: 'score', better: 'higher' }
  },
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
      for (const [k, v] of Object.entries(r)) if (k !== 'rank' && typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      if (typeof r.stability === 'string') metrics['stability: ' + r.stability] = 1;
      if (typeof r.hasBaseline24h === 'boolean') metrics.hasBaseline24h = Number(r.hasBaseline24h);
      if (typeof r.movementVisible === 'boolean') metrics.movementVisible = Number(r.movementVisible);
      const b = r.benchmark;
      if (b) {
        for (const [k, v] of Object.entries(b)) if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
        if (b.averageTimeMs != null) metrics.secondsPerBuild = b.averageTimeMs / 1000;
        if (typeof b.costEstimated === 'boolean') metrics.costEstimated = Number(b.costEstimated);
      }
      rows.push({ model: r.displayName, score: r.eloRating,
        low: typeof r.ciLower === 'number' && Number.isFinite(r.ciLower) ? r.ciLower : undefined,
        high: typeof r.ciUpper === 'number' && Number.isFinite(r.ciUpper) ? r.ciUpper : undefined,
        ...(typeof b?.averageCostUsd === 'number' ? {cost: b.averageCostUsd} : {}), metrics });
    }
    if (!rows.length) throw new Error('MineBench returned no rated models');
    return rows;
  },
};
export default board;
