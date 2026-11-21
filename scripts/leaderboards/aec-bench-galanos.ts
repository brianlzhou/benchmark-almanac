// AEC-Bench tests agents on engineering calculations. The leaderboard ranks mean reward and
// embeds the results by model, adapter and discipline in its page data.
import type { Leaderboard } from './types.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://www.aecbench.com/leaderboard";
const board: Leaderboard = {
  benchmark: 'aec-bench-galanos',
  url: "https://www.aecbench.com/leaderboard",
  feed,
  terms: "The site serves HTML for robots.txt. The benchmark code uses the MIT license. The results page gives no separate reuse license.",
  stats: {
    completion: { name: 'Completion rate', unit: 'score', better: 'higher', note: 'Completion rate from 0 to 1.' },
    completeTrials: { name: 'Completed trials', unit: 'count' },
    failedTrials: { name: 'Failed trials', unit: 'count', better: 'lower' },
    latency: { name: 'Mean duration', unit: 'seconds', better: 'lower' },
    p95Latency: { name: '95th percentile duration', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const page = nextFlight(await fetchText(feed));
    const count = jsonAfter<{ models: number }>(page, '"runStatus":').models;
    const entries = jsonAfter<{ model_display: string; adapter: string; reward: number; per_discipline: Record<string, number>;
      reward_ci: [number, number] | null; mean_cost_usd: number; mean_output_tokens: number; repetitions: number;
      last_submission: string; mean_duration_seconds: number; latency_p95_seconds: number; completion_rate: number;
      complete_trials: number; failed_trials: number; is_mock: boolean }[]>(page, '"entries":');
    if (entries.length < Math.max(18, count)) throw new Error('Incomplete AEC leaderboard');
    return entries.map(r => {
      if (r.is_mock || !r.model_display || !Number.isFinite(r.reward) || !Object.keys(r.per_discipline).length) throw new Error('Invalid AEC result');
      for (const key of Object.keys(r.per_discipline)) (board.parts ??= {})[key] = key[0].toUpperCase() + key.slice(1);
      return { model: r.model_display, harness: r.adapter, score: r.reward, date: r.last_submission.slice(0, 10),
        low: r.reward_ci?.[0], high: r.reward_ci?.[1], cost: r.mean_cost_usd, tokens: r.mean_output_tokens, trials: r.repetitions,
        metrics: { ...r.per_discipline, completion: r.completion_rate, completeTrials: r.complete_trials, failedTrials: r.failed_trials,
          latency: r.mean_duration_seconds, p95Latency: r.latency_p95_seconds } };
    });
  },
};
export default board;
