// Models buy upgrades and hire helpers to reach earnings targets in an idle game. The score compares simulated completion times with reference strategies.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-hustle-sim',
  url: 'https://glimmerindex.com/bench#hustlesim',
  feed: 'https://glimmerindex.com/api/bench/hustlesim',
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#hustlesim-method The site allows all paths in robots.txt.',
  fetch: () => crestGame(board, {"minimum": 18, "count": "games", "cost": "cost_per_game", "tokens": "", "latency": "seconds_per_decision", "date": "last_game", "tierMetric": "score", "tierScale": 1.0}),
};
export default board;
