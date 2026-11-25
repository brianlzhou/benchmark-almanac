// Nations Royale compares models playing a simulated strategy game. The game API gives their average score across wars and the score at each difficulty.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const FEED = "https://glimmerindex.com/api/bench/nationsroyale";

const board: Leaderboard = {
  benchmark: "crest-arcade-nations-royale",
  url: "https://glimmerindex.com/bench#nationsroyale",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#nationsroyale-method Glimmer Index allows all paths in robots.txt.",
  parts: { easy: 'Easy', medium: 'Medium', hard: 'Hard', extreme: 'Extreme' },
  stats: { wars: { name: 'Wars played', unit: 'count' }, aborted: { name: 'Aborted wars', unit: 'count' }, won: { name: 'Wars won', unit: 'count', better: 'higher' }, lost: { name: 'Wars lost', unit: 'count', better: 'lower' }, timeout: { name: 'Timed out wars', unit: 'count', better: 'lower' }, mean_share: { name: 'Mean share', unit: 'score', better: 'higher' }, decisions: { name: 'Decisions', unit: 'count' }, decisions_per_war: { name: 'Decisions per war', unit: 'count', better: 'lower' }, orders_per_decision: { name: 'Orders per decision', unit: 'count', better: 'lower' }, refused_rate: { name: 'Refusal rate', unit: 'score', better: 'lower' }, orders: { name: 'Orders', unit: 'count' }, refused: { name: 'Refused orders', unit: 'count', better: 'lower' }, refused_per_decision: { name: 'Refused orders per decision', unit: 'count', better: 'lower' }, unreadable_rate: { name: 'Unreadable response rate', unit: 'score', better: 'lower' }, retries: { name: 'Retries', unit: 'count', better: 'lower' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, requests: { name: 'Requests', unit: 'count' }, tokens_in_per_decision: { name: 'Input tokens per decision', unit: 'tokens', better: 'lower' }, tokens_out_per_decision: { name: 'Output tokens per decision', unit: 'tokens', better: 'lower' }, tokens_reasoning_per_decision: { name: 'Reasoning tokens per decision', unit: 'tokens', better: 'lower' }, seconds_per_decision: { name: 'Seconds per decision', unit: 'seconds', better: 'lower' }, model_minutes_per_war: { name: 'Model minutes per war', unit: 'minutes', better: 'lower' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' } },
  async fetch() {
    return crestGame(board, {"minimum": 17, "count": "wars", "cost": "cost_per_war", "tokens": "tokens_out_per_war", "latency": "seconds_per_decision", "date": "last_war", "tierMetric": "score"});
  },
};
export default board;
