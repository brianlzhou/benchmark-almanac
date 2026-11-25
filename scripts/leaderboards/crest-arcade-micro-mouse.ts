// Micro Mouse ranks models by pace against human finish times on daily mazes. The game API also scores each maze tier and the separate campaign.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const FEED = "https://glimmerindex.com/api/bench/micromouse";

const board: Leaderboard = {
  benchmark: "crest-arcade-micro-mouse",
  url: "https://glimmerindex.com/bench#micromouse",
  feed: FEED,
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#micromouse-method Glimmer Index allows all paths in robots.txt.",
  parts: { daily: 'Daily mazes', workbench: 'Workbench', cold: 'Cold Storage', fastlane: 'Fast Lane', nightshift: 'Night Shift' },
  stats: { runs: { name: 'Runs', unit: 'count' }, aborted: { name: 'Aborted runs', unit: 'count' }, campaign_score: { name: 'Campaign score', unit: 'score', better: 'higher' }, daily_runs: { name: 'Daily runs', unit: 'count' }, finished: { name: 'Finished runs', unit: 'count' }, finish_rate: { name: 'Finish rate', unit: 'score', better: 'higher' }, beat_bot: { name: 'Runs beating the bot', unit: 'count', better: 'higher' }, beat_median: { name: 'Runs beating human median', unit: 'count', better: 'higher' }, progress: { name: 'Progress', unit: 'score', better: 'higher' }, replies: { name: 'Replies', unit: 'count' }, replies_per_run: { name: 'Replies per run', unit: 'count', better: 'lower' }, segments_per_reply: { name: 'Segments per reply', unit: 'count', better: 'lower' }, clamped: { name: 'Clamped replies', unit: 'count', better: 'lower' }, trimmed: { name: 'Trimmed replies', unit: 'count', better: 'lower' }, refused: { name: 'Refused replies', unit: 'count', better: 'lower' }, unreadable: { name: 'Unreadable replies', unit: 'count', better: 'lower' }, unreadable_rate: { name: 'Unreadable response rate', unit: 'score', better: 'lower' }, retries: { name: 'Retries', unit: 'count', better: 'lower' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, requests: { name: 'Requests', unit: 'count' }, tokens_in_per_reply: { name: 'Input tokens per reply', unit: 'tokens', better: 'lower' }, tokens_out_per_reply: { name: 'Output tokens per reply', unit: 'tokens', better: 'lower' }, tokens_reasoning_per_reply: { name: 'Reasoning tokens per reply', unit: 'tokens', better: 'lower' }, seconds_per_reply: { name: 'Seconds per reply', unit: 'seconds', better: 'lower' }, model_minutes_per_run: { name: 'Model minutes per run', unit: 'minutes', better: 'lower' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' }, collisions_per_run: { name: 'Collisions per run', unit: 'count', better: 'lower' }, drifts_per_run: { name: 'Drifts per run', unit: 'count', better: 'lower' }, pad_boosts_per_run: { name: 'Pad boosts per run', unit: 'count', better: 'lower' } },
  async fetch() {
    return crestGame(board, {"minimum": 18, "count": "runs", "cost": "cost_per_run", "tokens": "tokens_out_per_run", "latency": "seconds_per_reply", "date": "last_run", "tierMetric": "score"});
  },
};
export default board;
