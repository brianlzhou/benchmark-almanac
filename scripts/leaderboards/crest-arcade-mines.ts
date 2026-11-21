// Models reveal or flag cells on Minesweeper boards that can be solved without guessing. The score averages win rates across four board sizes.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-mines',
  url: 'https://glimmerindex.com/bench#mines',
  feed: 'https://glimmerindex.com/api/bench/mines',
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#mines-method The site allows all paths in robots.txt.',
  fetch: () => crestGame(board, {"rankKey": "qualifiedRank", "minimum": 18, "count": "games", "cost": "cost_per_game", "tokens": "tokens_out_per_game", "latency": "seconds_per_game", "date": "last_game", "tierMetric": "rate", "tierScale": 100.0}),
};
export default board;
