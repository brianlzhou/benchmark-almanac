// Ravelin ranks tower-defense play relative to par. Its game API gives the overall score, interval, tier results, cost and game time.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const FEED = "https://glimmerindex.com/api/bench/ravelin";

const board: Leaderboard = {
  benchmark: "crest-arcade-ravelin",
  url: "https://glimmerindex.com/bench#ravelin",
  feed: FEED,
  parts: { daily: 'Daily siege', campaign: 'Campaign', iron: 'Iron' },
  stats: { games: { name: 'Games played', unit: 'count' }, aborted: { name: 'Aborted games', unit: 'count' }, won: { name: 'Games won', unit: 'count' }, win_rate: { name: 'Win rate', unit: 'score', better: 'higher' }, beat_par: { name: 'Games beating par', unit: 'count' }, points_per_game: { name: 'Points per game', unit: 'score', better: 'higher' }, lives_lost_per_game: { name: 'Lives lost per game', unit: 'count', better: 'lower' }, turns: { name: 'Turns', unit: 'count' }, orders: { name: 'Orders', unit: 'count' }, refused: { name: 'Refused orders', unit: 'count', better: 'lower' }, refused_rate: { name: 'Refusal rate', unit: 'score', better: 'lower' }, unreadable: { name: 'Unreadable replies', unit: 'count', better: 'lower' }, retries: { name: 'Retries', unit: 'count', better: 'lower' }, retry_rate: { name: 'Retry rate', unit: 'score', better: 'lower' }, towers_per_game: { name: 'Towers per game', unit: 'count' }, early_gold_per_game: { name: 'Early gold per game', unit: 'count' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, requests: { name: 'Requests', unit: 'count' }, tokens_in_per_turn: { name: 'Input tokens per turn', unit: 'tokens', better: 'lower' }, tokens_out_per_turn: { name: 'Output tokens per turn', unit: 'tokens', better: 'lower' }, tokens_reasoning_per_turn: { name: 'Reasoning tokens per turn', unit: 'tokens', better: 'lower' }, seconds_per_turn: { name: 'Seconds per turn', unit: 'seconds', better: 'lower' }, seconds_per_game: { name: 'Seconds per game', unit: 'seconds', better: 'lower' }, vs_par: { name: 'Score relative to par', unit: 'score', better: 'higher' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' }, cost_per_turn: { name: 'Cost per turn', unit: 'usd', better: 'lower' } },
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#ravelin-method Glimmer Index allows all paths in robots.txt.",
  async fetch() {
    return crestGame(board, {"minimum": 15, "count": "games", "cost": "cost_per_game", "tokens": "tokens_out_per_game", "latency": "seconds_per_game", "date": "last_game", "tierMetric": "score"});
  },
};
export default board;
