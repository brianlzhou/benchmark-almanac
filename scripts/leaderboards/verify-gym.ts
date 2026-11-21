// Verify Gym tests exact rational brackets around roots of x^x, kth roots and polynomial roots.
// The score is mean reward over the 120 held-out tasks, where only certified brackets earn reward.
// This importer reads the maker's published model scorecard JSON.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/carlostoledo1891/cert-machine/main/certs/verify-gym-scorecard.json';
const board: Leaderboard = {
  benchmark: 'verify-gym',
  url: 'https://github.com/carlostoledo1891/cert-machine/tree/main/environments/verify_gym',
  feed,
  terms: 'The cert-machine repository is published under the MIT License. https://github.com/carlostoledo1891/cert-machine/blob/main/LICENSE',
  stats: {
    xx: { name: 'x to the x family reward', unit: 'score', better: 'higher' },
    kroot: { name: 'Kth root family reward', unit: 'score', better: 'higher' },
    poly: { name: 'Polynomial family reward', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const source = await fetchJson(feed) as { models?: Array<Record<string, unknown>> };
    if (!Array.isArray(source.models)) throw new Error('Missing Verify Gym model scorecard');
    const rows: LeaderboardRow[] = [];
    for (const entry of source.models) {
      const model = typeof entry.model === 'string' ? entry.model : '';
      const score = typeof entry.mean_reward === 'number' ? entry.mean_reward : NaN;
      const byFamily = entry.by_family as Record<string, { mean_reward?: number }> | undefined;
      if (!model || !Number.isFinite(score) || !byFamily) continue;
      rows.push({
        model,
        score,
        setting: '120 held-out tasks, 8 samples per task, no tools',
        trials: typeof entry.n === 'number' ? entry.n : undefined,
        cost: typeof (entry.spend as { usage?: { cost_usd_reported?: number } } | undefined)?.usage?.cost_usd_reported === 'number' ? (entry.spend as { usage: { cost_usd_reported: number } }).usage.cost_usd_reported : undefined,
        metrics: Object.fromEntries(Object.entries(byFamily).filter(([, value]) => typeof value.mean_reward === 'number').map(([key, value]) => [key, value.mean_reward as number])),
      });
    }
    if (rows.length !== 7) throw new Error(`Expected seven Verify Gym model rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
