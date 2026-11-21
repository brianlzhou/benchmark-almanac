// Micro Mouse ranks models by pace against human finish times on daily mazes. The game API also scores each maze tier and the separate campaign.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const FEED = "https://glimmerindex.com/api/bench/micromouse";

const board: Leaderboard = {
  benchmark: "crest-arcade-micro-mouse",
  url: "https://glimmerindex.com/bench#micromouse",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#micromouse-method Glimmer Index allows all paths in robots.txt.",
  async fetch() {
    return crestGame(board, {"minimum": 18, "count": "runs", "cost": "cost_per_run", "tokens": "tokens_out_per_run", "latency": "seconds_per_reply", "date": "last_run", "tierMetric": "score"});
  },
};
export default board;
