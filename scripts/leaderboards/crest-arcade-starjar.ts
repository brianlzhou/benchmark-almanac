// Models place pieces in a jar so matching pieces touch and merge. The score compares their total points with a reference bot on identical jars.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-starjar',
  url: 'https://glimmerindex.com/bench#starjar',
  feed: 'https://glimmerindex.com/api/bench/starjar',
  parts: { opening: 'Daily opening', fresh: 'Fresh jar', midgame: 'Midgame' },
  stats: { games: { name: 'Games played', unit: 'count' }, aborted: { name: 'Aborted games', unit: 'count' }, points_per_game: { name: 'Points per game', unit: 'score', better: 'higher' }, beat_bot: { name: 'Games beating the bot', unit: 'count', better: 'higher' }, black_holes: { name: 'Black holes triggered', unit: 'count', better: 'higher' }, drops: { name: 'Drops', unit: 'count' }, clamped: { name: 'Clamped drops', unit: 'count', better: 'lower' }, clamped_rate: { name: 'Clamped drop rate', unit: 'score', better: 'lower' }, retries: { name: 'Retries', unit: 'count', better: 'lower' }, retry_rate: { name: 'Retry rate', unit: 'score', better: 'lower' }, best_chain: { name: 'Best chain', unit: 'count', better: 'higher' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, requests: { name: 'Requests', unit: 'count' }, tokens_in_per_drop: { name: 'Input tokens per drop', unit: 'tokens', better: 'lower' }, tokens_out_per_drop: { name: 'Output tokens per drop', unit: 'tokens', better: 'lower' }, tokens_reasoning_per_drop: { name: 'Reasoning tokens per drop', unit: 'tokens', better: 'lower' }, seconds_per_drop: { name: 'Seconds per drop', unit: 'seconds', better: 'lower' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' }, cost_per_drop: { name: 'Cost per drop', unit: 'usd', better: 'lower' } },
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#starjar-method The site allows all paths in robots.txt.',
  fetch: () => crestGame(board, {"minimum": 15, "count": "games", "cost": "cost_per_game", "tokens": "", "latency": "seconds_per_drop", "date": "last_game", "tierMetric": "score", "tierScale": 1.0}),
};
export default board;
