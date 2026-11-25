// Elemental Armory ranks contestants by mean match win rate across three levels.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame, crestStats } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-elemental-armory',
  url: 'https://glimmerindex.com/bench#elementalarmory',
  feed: 'https://glimmerindex.com/api/bench/elementalarmory',
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#elementalarmory-method The site allows all paths in robots.txt.',
  parts: { level1: 'Level 1', level5: 'Level 5', level8: 'Level 8' },
  stats: {
    ...crestStats({ minimum: 18, count: 'matches', cost: 'cost_per_match', tokens: 'tokens_out_per_match', latency: 'seconds_per_match', date: 'last_match' }),
    setup_defaults: { name: 'Default setups', unit: 'count', better: 'lower' },
  },
  fetch: () => crestGame(board, {"minimum": 18, "count": "matches", "cost": "cost_per_match", "tokens": "tokens_out_per_match", "latency": "seconds_per_match", "date": "last_match", "tierMetric": "rate", "tierScale": 100.0}),
};
export default board;
