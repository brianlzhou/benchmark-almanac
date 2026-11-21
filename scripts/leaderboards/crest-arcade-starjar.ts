// Models place pieces in a jar so matching pieces touch and merge. The score compares their total points with a reference bot on identical jars.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-starjar',
  url: 'https://glimmerindex.com/bench#starjar',
  feed: 'https://glimmerindex.com/api/bench/starjar',
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#starjar-method The site allows all paths in robots.txt.',
  fetch: () => crestGame(board, {"minimum": 15, "count": "games", "cost": "cost_per_game", "tokens": "", "latency": "seconds_per_drop", "date": "last_game", "tierMetric": "score", "tierScale": 1.0}),
};
export default board;
