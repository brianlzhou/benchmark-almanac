// GameAdsBench ranks game advertising video models by ratings from pairwise votes.
// Video Arena publishes the ratings, vote counts and confidence intervals in its leaderboard API.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://video-arena.com/gameadsbench/api/leaderboard";
interface Entry {
  display_name: string; elo: number; ci_low: number; ci_high: number; votes: number; price_per_second: number | null;
}

const board: Leaderboard = {
  benchmark: "gameadsbench",
  url: "https://video-arena.com/gameadsbench/leaderboard",
  feed,
  terms: "Video Arena’s Terms of Use describes abuse controls and third-party processing. It gives no explicit reuse license for leaderboard scores. https://video-arena.com/gameadsbench/leaderboard The publisher allows crawlers in robots.txt.",
  aliases: { 'Seedance 2.0': 'dreamina-seedance-2-0', 'Seedance 2.5': 'dreamina-seedance-2-5' },
  stats: { votes: { name: 'Votes', unit: 'count' } },
  async fetch() {
    const {snapshot} = await fetchJson<{ snapshot: { rows: Entry[] } }>(feed);
    if (snapshot.rows.length < 7) throw new Error('Expected at least seven GameAdsBench models');
    return snapshot.rows.map(row => {
      if (!row.display_name || ![row.elo, row.ci_low, row.ci_high, row.votes].every(Number.isFinite)) throw new Error('Missing GameAdsBench rating fields');
      const metrics: Record<string, number> = { votes: row.votes };
      if (typeof row.price_per_second === 'number') metrics.pricePerSecond = row.price_per_second;
      return { model: row.display_name, score: row.elo, low: row.ci_low, high: row.ci_high, metrics };
    });
  },
};
export default board;
