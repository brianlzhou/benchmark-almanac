// RoboChallenge Table30 (v1, retired 2026-05-27). robochallenge.ai is a Vue app; its leaderboard store loads
// /api/v1/leaderboard/leaderboard_all.json, one entry per submitted policy with success_ratio (share of the
// 300 real-robot rollouts that succeed, 0 to 1) and a progress score. The board sorts by success rate, and
// the record's headline is success rate, so the score is success_ratio times 100. Entries are policies
// fine-tuned per task by the submitter; RoboChallenge's own baselines (user rc_baseline) are π0 and π0.5.
// The entry's progress score ("score", 0 to 100, partial credit for task progress) is kept as metrics.progress.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://robochallenge.ai/api/v1/leaderboard/leaderboard_all.json';

const board: Leaderboard = {
  benchmark: 'robochallenge',
  url: 'https://robochallenge.ai/leaderboard',
  feed: `${FEED} (success_ratio)`,
  terms: 'Static JSON the public leaderboard page loads; robochallenge.ai serves no robots.txt rules (the path returns the app) and states no terms for the board.',
  async fetch() {
    const data = await fetchJson<{ display_name: string; success_ratio: number; score?: number }[]>(FEED);
    return data.map(
      (e): LeaderboardRow => ({
        model: e.display_name,
        score: e.success_ratio * 100,
        metrics: typeof e.score === 'number' ? { progress: e.score } : undefined,
      }),
    );
  },
};
export default board;
