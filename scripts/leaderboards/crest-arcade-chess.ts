// Crest Arcade Chess fits ratings from games against fixed opponents. Its public API supplies the combined rating, its interval and the two variant ratings.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://glimmerindex.com/api/bench/chess";

interface Result { rating: number; rating_low: number; rating_high: number; games: number }
interface Variant extends Result {
  cost_known: boolean; cost_total: number; model_minutes_per_game: number; last_game: string;
  tokens_out_per_move: number; moves: number; model_turns: number; latency_ms: number;
}
interface Player { name: string; effort: string; open_weights: boolean; overall: Result; variants: Record<string, Variant> }

const board: Leaderboard = {
  benchmark: "crest-arcade-chess",
  url: "https://glimmerindex.com/bench/chess",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench/chess#method Glimmer Index allows all paths in robots.txt.",
  parts: { standard: 'Standard', chess960: 'Chess960' },
  async fetch() {
    const { contestants } = await fetchJson<{ contestants: Player[] }>(FEED);
    if (contestants.length < 20) throw new Error('Expected twenty chess contestants');
    return contestants.map((p) => {
      const v = [p.variants.standard, p.variants.chess960];
      const r = p.overall;
      if (!p.name || !Number.isFinite(r.rating) || !r.games || !v.every((x) => Number.isFinite(x?.rating))) throw new Error('Incomplete chess rating');
      const metrics: Record<string, number> = { standard: v[0].rating, chess960: v[1].rating };
      for (const [variant, stats] of Object.entries(p.variants)) {
        for (const [key, value] of Object.entries(stats)) {
          if (typeof value === 'number' && Number.isFinite(value)) metrics[variant + '_' + key] = value;
        }
      }
      return { model: p.name, score: r.rating, low: r.rating_low, high: r.rating_high, trials: r.games, setting: p.effort,
        open: p.open_weights, date: v.map((x) => x.last_game).sort().at(-1)?.slice(0, 10),
        cost: v.every((x) => x.cost_known) ? v.reduce((n, x) => n + x.cost_total, 0) / r.games : undefined, metrics };
    });
  },
};
export default board;
