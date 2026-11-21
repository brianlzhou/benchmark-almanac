// FreshStack evaluates retrieval systems on five niche technical domains. The
// leaderboard ranks systems by mean Recall@50 and publishes mean alpha-nDCG@10
// and Coverage@20 in a JSON file beside each system's domain results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://fresh-stack.github.io/#leaderboard';
const FEED = 'https://fresh-stack.github.io/leaderboard_data.json';

interface Entry {
  info?: { name?: string; date?: string; link?: string; size?: string };
  datasets?: { average?: { alpha_ndcg_10?: number; coverage_20?: number; recall_50?: number } };
}

const board: Leaderboard = {
  benchmark: 'freshstack',
  url: PAGE,
  feed: FEED,
  terms: 'The authors publish this JSON leaderboard on the project website. Separate score reuse terms are not stated.',
  parts: {
    alphaNdcg10: { name: 'alpha-nDCG@10', group: 'Retrieval metrics' },
    coverage20: { name: 'Coverage@20', group: 'Retrieval metrics' },
  },
  async fetch() {
    const data = await fetchJson<{ leaderboardData?: Entry[] }>(FEED);
    const entries = data.leaderboardData ?? [];
    const rows: LeaderboardRow[] = entries.flatMap((entry) => {
      const name = entry.info?.name?.trim();
      const average = entry.datasets?.average;
      if (!name || typeof average?.recall_50 !== 'number') return [];
      const metrics: Record<string, number> = {};
      if (typeof average.alpha_ndcg_10 === 'number') metrics.alphaNdcg10 = average.alpha_ndcg_10;
      if (typeof average.coverage_20 === 'number') metrics.coverage20 = average.coverage_20;
      return [{ model: name, score: average.recall_50, date: entry.info?.date, link: entry.info?.link, metrics }];
    });
    if (rows.length < 10) throw new Error(`FreshStack: ${rows.length} systems, expected at least 10`);
    return rows;
  },
};

export default board;
