// Models select a team of animals and choose where each lands in a village. The score measures the share of village strength they destroy.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-wildhaven',
  url: 'https://glimmerindex.com/bench#wildhaven',
  feed: 'https://glimmerindex.com/api/bench/wildhaven',
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#wildhaven-method The site allows all paths in robots.txt.',
  fetch: () => crestGame(board, {"minimum": 15, "count": "raids", "cost": "cost_per_raid", "tokens": "", "latency": "seconds_per_request", "date": "last_raid", "tierMetric": "score", "tierScale": 1.0}),
};
export default board;
