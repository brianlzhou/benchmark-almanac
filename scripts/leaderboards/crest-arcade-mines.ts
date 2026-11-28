// Models reveal or flag cells on Minesweeper boards that can be solved without guessing. The score averages win rates across four board sizes.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-mines',
  url: 'https://glimmerindex.com/bench#mines',
  feed: 'https://glimmerindex.com/api/bench/mines',
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#mines-method The site allows all paths in robots.txt.',
  parts: { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Expert', master: 'Master' },
  stats: { games: { name: 'Games played', unit: 'count' }, aborted: { name: 'Aborted games', unit: 'count' }, won: { name: 'Games won', unit: 'count' }, win_rate: { name: 'Win rate', unit: 'score', better: 'higher' }, progress: { name: 'Progress', unit: 'score', better: 'higher' }, turn_capped: { name: 'Turn-capped games', unit: 'count' }, stalled: { name: 'Stalled games', unit: 'count', better: 'lower' }, wrong_flags: { name: 'Wrong flags', unit: 'count', better: 'lower' }, wrong_flags_per_game: { name: 'Wrong flags per game', unit: 'count', better: 'lower' }, games_with_wrong_flags: { name: 'Games with wrong flags', unit: 'count' }, actions: { name: 'Actions', unit: 'count' }, illegal: { name: 'Illegal actions', unit: 'count', better: 'lower' }, illegal_rate: { name: 'Illegal action rate', unit: 'score', better: 'lower' }, wasted: { name: 'Wasted actions', unit: 'count', better: 'lower' }, wasted_rate: { name: 'Wasted action rate', unit: 'score', better: 'lower' }, unreadable_replies: { name: 'Unreadable replies', unit: 'count', better: 'lower' }, turns_per_game: { name: 'Turns per game', unit: 'count', better: 'lower' }, requests_per_game: { name: 'Requests per game', unit: 'count', better: 'lower' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' }, reasoningTokens: { name: 'Reasoning tokens', unit: 'tokens', better: 'lower' }, seconds_per_game: { name: 'Seconds per game', unit: 'seconds', better: 'lower' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' }, cost_per_win: { name: 'Cost per win', unit: 'usd', better: 'lower' } },
  fetch: () => crestGame(board, {"minimum": 18, "count": "games", "cost": "cost_per_game", "tokens": "tokens_out_per_game", "latency": "seconds_per_game", "date": "last_game", "tierMetric": "rate", "tierScale": 100.0}),
};
export default board;
