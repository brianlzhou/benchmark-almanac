// WitnessBench v2.0. witnessbench.ai renders its leaderboard table from /data/witnessbench-v2.0.csv: per model
// the reasoning effort, OAE-L20 (optimal action efficiency over 20 levels, 0 to 100, the page's first
// metric and sort), levels beaten, cost per game and output tokens per game. OAE-L20 is the score and effort
// the setting. A game is one task, so cost and output tokens per game are kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://witnessbench.ai/data/witnessbench-v2.0.csv';

const board: Leaderboard = {
  benchmark: 'witnessbench',
  url: 'https://witnessbench.ai/',
  feed: `${FEED} (oae_l20)`,
  terms: 'CSV the witnessbench.ai page loads; robots.txt allows all paths and the site states no terms.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.oae_l20);
      if (!r.model || !Number.isFinite(score)) continue;
      const cost = Number(r.cost_per_game_usd);
      const tokens = Number(r.output_tokens_per_game);
      rows.push({
        model: r.model.trim(),
        score,
        setting: r.reasoning_effort || undefined,
        cost: Number.isFinite(cost) ? cost : undefined,
        tokens: Number.isFinite(tokens) ? tokens : undefined,
      });
    }
    return rows;
  },
};
export default board;
