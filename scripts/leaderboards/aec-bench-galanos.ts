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
  parts: {
    civil: 'Civil',
    electrical: 'Electrical',
    ground: 'Ground',
    mechanical: 'Mechanical',
    structural: 'Structural',
  },
  stats: {
    completion: { name: 'Completion rate', unit: 'score', better: 'higher', note: 'Completion rate from 0 to 1.' },
    completeTrials: { name: 'Completed trials', unit: 'count' },
    failedTrials: { name: 'Failed trials', unit: 'count', better: 'lower' },
    latency: { name: 'Mean duration', unit: 'seconds', better: 'lower' },
    p95Latency: { name: '95th percentile duration', unit: 'seconds', better: 'lower' },
    inputTokens: { name: 'Mean input tokens', unit: 'tokens', better: 'lower' },
    totalCost: { name: 'Total run cost', unit: 'usd', better: 'lower' },
    reliabilityAdjustedReward: { name: 'Reliability-adjusted reward', unit: 'score', better: 'higher' },
    zeroRewardRate: { name: 'Zero-reward rate', unit: 'score', better: 'lower', note: 'Share of trials scoring zero, from 0 to 1.' },
    partialCreditRate: { name: 'Partial-credit rate', unit: 'score', note: 'Share of trials receiving partial credit, from 0 to 1.' },
  },
  chart: {
    title: 'Mean reward versus cost',
    x: { key: 'cost', label: 'Mean cost per completed task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Mean reward', unit: 'score', better: 'higher' },
    note: 'Interactive Pareto frontier of models and adapters by mean reward against cost per completed task.',
  },
  async fetch() {
    const page = nextFlight(await fetchText(feed));
    const count = jsonAfter<{ models: number }>(page, '"runStatus":').models;
    const entries = jsonAfter<{ model_display: string; adapter: string; reward: number; per_discipline: Record<string, number>;
      reward_ci: [number, number] | null; mean_cost_usd: number; total_cost_usd?: number; mean_input_tokens?: number; mean_output_tokens: number; repetitions: number;
      last_submission: string; mean_duration_seconds: number; latency_p95_seconds: number; completion_rate: number;
      complete_trials: number; failed_trials: number; reliability_adjusted_reward?: number; zero_reward_rate?: number; partial_credit_rate?: number; is_mock: boolean }[]>(page, '"entries":');
    if (entries.length < Math.max(18, count)) throw new Error('Incomplete AEC leaderboard');
    return entries.map(r => {
      if (r.is_mock || !r.model_display || !Number.isFinite(r.reward) || !Object.keys(r.per_discipline).length) throw new Error('Invalid AEC result');
      const metrics: Record<string, number> = { ...r.per_discipline, completion: r.completion_rate, completeTrials: r.complete_trials, failedTrials: r.failed_trials,
        latency: r.mean_duration_seconds, p95Latency: r.latency_p95_seconds };
      if (typeof r.mean_input_tokens === 'number' && Number.isFinite(r.mean_input_tokens)) metrics.inputTokens = r.mean_input_tokens;
      if (typeof r.total_cost_usd === 'number' && Number.isFinite(r.total_cost_usd)) metrics.totalCost = r.total_cost_usd;
      if (typeof r.reliability_adjusted_reward === 'number' && Number.isFinite(r.reliability_adjusted_reward)) metrics.reliabilityAdjustedReward = r.reliability_adjusted_reward;
      if (typeof r.zero_reward_rate === 'number' && Number.isFinite(r.zero_reward_rate)) metrics.zeroRewardRate = r.zero_reward_rate;
      if (typeof r.partial_credit_rate === 'number' && Number.isFinite(r.partial_credit_rate)) metrics.partialCreditRate = r.partial_credit_rate;
      return { model: r.model_display, harness: r.adapter, score: r.reward, date: r.last_submission.slice(0, 10),
        low: r.reward_ci?.[0], high: r.reward_ci?.[1], cost: r.mean_cost_usd, tokens: r.mean_output_tokens, trials: r.repetitions,
        metrics };
    });
  },
};
export default board;
