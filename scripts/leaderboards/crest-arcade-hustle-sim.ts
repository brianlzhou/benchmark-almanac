// Models buy upgrades and hire helpers to reach earnings targets in an idle game. The score compares simulated completion times with reference strategies.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-hustle-sim',
  url: 'https://glimmerindex.com/bench#hustlesim',
  feed: 'https://glimmerindex.com/api/bench/hustlesim',
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#hustlesim-method The site allows all paths in robots.txt.',
  parts: { fresh: 'Fresh start', takeover: 'Takeover', empire: 'Empire' },
  stats: {
    games: { name: 'Games played', unit: 'count' }, aborted: { name: 'Aborted games', unit: 'count' }, reached: { name: 'Games reaching the target', unit: 'count' }, beat_best: { name: 'Games beating the best reference', unit: 'count' }, slowdown: { name: 'Slowdown', unit: 'speedup', better: 'lower' }, decisions: { name: 'Decisions', unit: 'count' }, decisions_per_game: { name: 'Decisions per game', unit: 'count', better: 'lower' }, actions: { name: 'Actions', unit: 'count' }, actions_per_decision: { name: 'Actions per decision', unit: 'count', better: 'lower' }, refused: { name: 'Refused actions', unit: 'count', better: 'lower' }, refused_rate: { name: 'Refusal rate', unit: 'score', better: 'lower', note: 'Rate from 0 to 1 of actions refused by the model.' }, refused_per_decision: { name: 'Refused actions per decision', unit: 'count', better: 'lower' }, unreadable_rate: { name: 'Unreadable response rate', unit: 'score', better: 'lower' }, retries: { name: 'Retries', unit: 'count', better: 'lower' }, purchases: { name: 'Purchases', unit: 'count' }, requests: { name: 'Requests', unit: 'count' }, tokens_in_per_decision: { name: 'Input tokens per decision', unit: 'tokens', better: 'lower' }, tokens_out_per_decision: { name: 'Output tokens per decision', unit: 'tokens', better: 'lower' }, tokens_reasoning_per_decision: { name: 'Reasoning tokens per decision', unit: 'tokens', better: 'lower' }, seconds_per_decision: { name: 'Seconds per decision', unit: 'seconds', better: 'lower' }, model_minutes_per_game: { name: 'Model minutes per game', unit: 'minutes', better: 'lower' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' },
  },
  fetch: () => crestGame(board, {"minimum": 18, "count": "games", "cost": "cost_per_game", "tokens": "", "latency": "seconds_per_decision", "date": "last_game", "tierMetric": "score", "tierScale": 1.0}),
};
export default board;
