// Nations Royale compares models playing a simulated strategy game. The game API gives their average score across wars and the score at each difficulty.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const FEED = "https://glimmerindex.com/api/bench/nationsroyale";

const board: Leaderboard = {
  benchmark: "crest-arcade-nations-royale",
  url: "https://glimmerindex.com/bench#nationsroyale",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#nationsroyale-method Glimmer Index allows all paths in robots.txt.",
  async fetch() {
    return crestGame(board, {"minimum": 17, "count": "wars", "cost": "cost_per_war", "tokens": "tokens_out_per_war", "latency": "seconds_per_decision", "date": "last_war", "tierMetric": "score"});
  },
};
export default board;
