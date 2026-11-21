// Enterprise-Bench ranks agent and model pairs by accuracy on its L1 and L2 questions.
// Harbor Hub publishes accuracy, trials and resource usage on the original package's main leaderboard.
import type { Leaderboard } from './types.ts';
import { harborRows, harborFeed, harborTerms } from './browser-use-linkedin.ts';

// Harbor reports pass@k and whole-run token counts alongside accuracy.
const resourceKeys: Record<string, string> = {
  total_tokens: 'runTotalTokens',
  output_tokens: 'runOutputTokens',
  cached_input_tokens: 'runCachedInputTokens',
  uncached_input_tokens: 'runUncachedInputTokens',
  accuracy_stderr: 'stderr',
};

export function harborMetricKey(key: string): string {
  return resourceKeys[key] ?? key.replace(/^pass_at_(\d+)$/, 'passAt$1');
}

const board: Leaderboard = {
  benchmark: 'enterprise-bench-l1-l2',
  url: 'https://hub.harborframework.com/datasets/Enterprise-Bench/l1-l2-bench?tab=leaderboard',
  feed: harborFeed, terms: harborTerms, harnesses: 'system', costPer: 'run',
  stats: {
    accuracy: { name: 'Accuracy', unit: '%', better: 'higher' },
    n_trials: { name: 'Trials', unit: 'count' },
    pass_at_2: { name: 'pass@2', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    pass_at_3: { name: 'pass@3', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    pass_at_4: { name: 'pass@4', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    pass_at_5: { name: 'pass@5', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    pass_at_8: { name: 'pass@8', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    pass_at_10: { name: 'pass@10', unit: 'score', better: 'higher', note: 'Pass rate from 0 to 1.' },
    total_tokens: { name: 'Total tokens', unit: 'tokens' },
    output_tokens: { name: 'Output tokens', unit: 'tokens' },
    cached_input_tokens: { name: 'Cached input tokens', unit: 'tokens' },
    uncached_input_tokens: { name: 'Uncached input tokens', unit: 'tokens' },
    total_cost_usd: { name: 'Total run cost', unit: 'usd', better: 'lower' },
    latency: { name: 'Latency', unit: 'seconds', better: 'lower' },
    avg_trial_duration_sec: { name: 'Average trial duration', unit: 'seconds', better: 'lower' },
  },
  aliases: { 'GLM-5.3 (LiteLLM → Baseten)': 'glm-5-3' },
  async fetch() {
    const rows = await harborRows('Enterprise-Bench/l1-l2-bench', 'main', 34);
    return rows.map(({ metadata, metrics, created_at }) => {
      if (!metadata.model_display_name || !metadata.agent_display_name || !Number.isFinite(metrics.accuracy)) throw new Error('Missing enterprise leaderboard fields');
      const numeric = Object.fromEntries(Object.entries(metrics).filter(([, value]) => Number.isFinite(value)).map(([key, value]) => [harborMetricKey(key), value]));
      return {
        model: metadata.model_display_name, harness: metadata.agent_display_name, agentOrg: metadata.agent_org_display_name,
        score: metrics.accuracy, date: created_at.slice(0, 10), trials: metrics.n_trials, cost: metrics.total_cost_usd,
        tokens: metrics.n_trials > 0 && Number.isFinite(metrics.output_tokens) ? metrics.output_tokens / metrics.n_trials : undefined,
        metrics: { ...numeric, ...(Number.isFinite(metrics.avg_trial_duration_sec) ? { latency: metrics.avg_trial_duration_sec } : {}) },
      };
    });
  },
};
export default board;
