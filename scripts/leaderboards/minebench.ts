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
    ratingDeviation: { name: 'Rating deviation', unit: 'rating', better: 'lower' },
    confidence: { name: 'Confidence', unit: '%', better: 'higher' },
    shownCount: { name: 'Shown prompts', unit: 'count' },
    winCount: { name: 'Wins', unit: 'count' },
    lossCount: { name: 'Losses', unit: 'count' },
    drawCount: { name: 'Draws', unit: 'count' },
    bothBadCount: { name: 'Both-bad votes', unit: 'count' },
    qualityFloorScore: { name: 'Quality floor score', unit: 'score', better: 'higher' },
    meanScore: { name: 'Mean score', unit: 'score', better: 'higher' },
    scoreSpread: { name: 'Score spread', unit: 'score' },
    consistency: { name: 'Consistency', unit: '%', better: 'higher' },
    sampledVotes: { name: 'Sampled votes', unit: 'count' },
    averageBlocks: { name: 'Average blocks', unit: 'count' },
    secondsPerBuild: { name: 'Seconds per build', unit: 'seconds', better: 'lower' },
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
    const topKeys = [
      'ratingDeviation', 'ci95', 'confidence', 'shownCount', 'winCount', 'lossCount', 'drawCount',
      'bothBadCount', 'qualityFloorScore', 'meanScore', 'scoreVariance', 'scoreSpread', 'consistency', 'sampledVotes',
    ];
    for (const r of data.models) {
      if (!r.displayName || !Number.isFinite(r.eloRating)) continue;
      const metrics: Record<string, number> = {};
      for (const k of topKeys) {
        const v = r[k];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      const b = r.benchmark;
      if (b) {
        if (typeof b.averageBlocks === 'number' && Number.isFinite(b.averageBlocks)) metrics.averageBlocks = b.averageBlocks;
        if (typeof b.averageTimeMs === 'number' && Number.isFinite(b.averageTimeMs)) metrics.secondsPerBuild = b.averageTimeMs / 1000;
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
