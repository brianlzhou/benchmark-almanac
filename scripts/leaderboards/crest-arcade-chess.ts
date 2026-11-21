// Crest Arcade Chess fits ratings from games against fixed opponents. Its public API supplies the combined rating, its interval and the two variant ratings.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://glimmerindex.com/api/bench/chess";
const variantFields: Record<string, { name: string; unit: string; better?: 'higher' | 'lower' }> = {
  games: { name: 'Games played', unit: 'count' }, aborted: { name: 'Aborted games', unit: 'count' }, rating: { name: 'Rating', unit: 'rating', better: 'higher' }, wins: { name: 'Wins', unit: 'count' }, draws: { name: 'Draws', unit: 'count' }, losses: { name: 'Losses', unit: 'count' }, score: { name: 'Score', unit: 'score', better: 'higher' }, forfeits: { name: 'Forfeits', unit: 'count' }, adjudicated: { name: 'Adjudicated games', unit: 'count' }, avg_plies: { name: 'Average plies', unit: 'count', better: 'lower' }, moves: { name: 'Moves', unit: 'count', better: 'lower' }, accuracy: { name: 'Accuracy', unit: 'score', better: 'higher' }, contested_accuracy: { name: 'Contested accuracy', unit: 'score', better: 'higher' }, contested_moves: { name: 'Contested moves', unit: 'count' }, acpl: { name: 'Average centipawn loss', unit: 'score', better: 'lower' }, top1: { name: 'Top-1 move accuracy', unit: 'score', better: 'higher' }, top3: { name: 'Top-3 move accuracy', unit: 'score', better: 'higher' }, inaccuracies_per_100: { name: 'Inaccuracies per 100 moves', unit: 'count', better: 'lower' }, mistakes_per_100: { name: 'Mistakes per 100 moves', unit: 'count', better: 'lower' }, blunders_per_100: { name: 'Blunders per 100 moves', unit: 'count', better: 'lower' }, model_turns: { name: 'Model turns', unit: 'count', better: 'lower' }, latency_ms: { name: 'Latency', unit: 'ms', better: 'lower' }, requests: { name: 'Requests', unit: 'count' }, illegal_attempts: { name: 'Illegal attempts', unit: 'count', better: 'lower' }, illegal_moves: { name: 'Illegal moves', unit: 'count', better: 'lower' }, unreadable_attempts: { name: 'Unreadable attempts', unit: 'count', better: 'lower' }, illegal_rate: { name: 'Illegal move rate', unit: 'score', better: 'lower' }, missing_tag_rate: { name: 'Missing tag rate', unit: 'score', better: 'lower' }, first_try_legal: { name: 'First-try legal rate', unit: 'score', better: 'higher' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, tokens_in_per_move: { name: 'Input tokens per move', unit: 'tokens', better: 'lower' }, tokens_out_per_move: { name: 'Output tokens per move', unit: 'tokens', better: 'lower' }, tokens_reasoning_per_move: { name: 'Reasoning tokens per move', unit: 'tokens', better: 'lower' }, seconds_per_move: { name: 'Seconds per move', unit: 'seconds', better: 'lower' }, model_minutes_per_game: { name: 'Model minutes per game', unit: 'minutes', better: 'lower' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' }, cost_per_game: { name: 'Cost per game', unit: 'usd', better: 'lower' }, cost_per_move: { name: 'Cost per move', unit: 'usd', better: 'lower' },
};
const chessStats = Object.fromEntries(Object.entries({ standard: 'Standard', chess960: 'Chess960' }).flatMap(([variant, name]) => Object.entries(variantFields).map(([key, stat]) => [`${variant}_${key}`, { ...stat, name: `${name} ${stat.name.toLowerCase()}` }])));

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
  stats: chessStats,
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
