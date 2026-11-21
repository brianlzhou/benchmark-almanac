// Crest Arcade Sudoku scores completed grids across seven difficulty tiers. The puzzle API supplies solve rates, score intervals and cost and tokens per puzzle.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const FEED = "https://glimmerindex.com/api/bench/sudoku";

const board: Leaderboard = {
  benchmark: "crest-arcade-sudoku",
  url: "https://glimmerindex.com/bench#sudoku",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#sudoku-method Glimmer Index allows all paths in robots.txt.",
  async fetch() {
    return crestGame(board, {"minimum": 18, "count": "attempts", "cost": "cost_per_puzzle", "tokens": "tokens_out_per_puzzle", "latency": "seconds_per_puzzle", "date": "last_attempt", "tierMetric": "rate", "tierScale": 100});
  },
};
export default board;
