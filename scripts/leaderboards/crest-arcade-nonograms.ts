// Models reconstruct a picture from row and column clues in one reply. The score averages the share of exact solutions across six tiers.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-nonograms',
  url: 'https://glimmerindex.com/bench#nonograms',
  feed: 'https://glimmerindex.com/api/bench/nonograms',
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#nonograms-method The site allows all paths in robots.txt.',
  fetch: () => crestGame(board, {"minimum": 15, "count": "attempts", "cost": "cost_per_puzzle", "tokens": "tokens_out_per_puzzle", "latency": "seconds_per_puzzle", "date": "last_attempt", "tierMetric": "rate", "tierScale": 100.0}),
};
export default board;
