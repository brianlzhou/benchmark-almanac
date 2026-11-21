// Ravelin ranks tower-defense play relative to par. Its game API gives the overall score, interval, tier results, cost and game time.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const FEED = "https://glimmerindex.com/api/bench/ravelin";

const board: Leaderboard = {
  benchmark: "crest-arcade-ravelin",
  url: "https://glimmerindex.com/bench#ravelin",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#ravelin-method Glimmer Index allows all paths in robots.txt.",
  async fetch() {
    return crestGame(board, {"minimum": 15, "count": "games", "cost": "cost_per_game", "tokens": "tokens_out_per_game", "latency": "seconds_per_game", "date": "last_game", "tierMetric": "score"});
  },
};
export default board;
