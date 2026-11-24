// Red Hat Emerging Technologies evaluates coding agents on the 40 public SRE scenarios from
// ArtificialAnalysis/ITBench-AA in its MIT-licensed Coding Agent Leaderboard Space.
// Reads the live results CSV directly from Red Hat's Space (independent of Artificial Analysis's
// own site), capturing solve rate (%), per-task cost and output tokens, all operating stats,
// and the Space's Efficiency (Score vs Total Tokens) Pareto chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard/resolve/main/results.csv';

const TOKEN_KEYS: Record<string, string> = {
  mean_tokens_per_task: 'totalTokens',
  mean_input_tokens_per_task: 'inputTokens',
  mean_output_tokens_per_task: 'outputTokens',
  mean_cache_tokens_per_task: 'cachedTokens',
};

const board: Leaderboard = {
  benchmark: 'itbench-aa',
  url: 'https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard',
  feed: FEED,
  host: 'Red Hat Emerging Technologies',
  terms: 'The Space lists MIT for its repository. https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard/blob/main/README.md',
  headline: 'Red Hat evaluates coding agents on the 40 public SRE scenarios from ArtificialAnalysis/ITBench-AA (the full release also includes 19 private holdout scenarios).',
  aliases: {
    'GLM 5.3': 'glm-5-3',
    'Haiku 4.5': 'claude-haiku-4-5',
    'Opus 5.5': 'claude-opus-5-5',
    'Qwen3.8 Flash Next': 'qwen3-8-flash-next',
    'Sonnet 5.5': 'claude-sonnet-5-5',
    'Sonnet 5': 'claude-sonnet-5',
  },
  chart: {
    title: 'Efficiency (Score vs Total Tokens)',
    x: { key: 'totalTokens', label: 'Mean total tokens per task', unit: 'tokens', better: 'lower', log: true },
    y: { key: 'score', label: 'Score', unit: '%', better: 'higher' },
    note: 'Red Hat Coding Agent Leaderboard Trade-offs Efficiency plot with its log-scale total tokens axis and Pareto frontier.',
  },
  stats: {
    n_tasks: { name: 'Tasks', unit: 'count' },
    n_errors: { name: 'Errors', unit: 'count', better: 'lower' },
    n_input_tokens: { name: 'Input tokens', unit: 'tokens' },
    n_cache_tokens: { name: 'Cached input tokens', unit: 'tokens' },
    n_output_tokens: { name: 'Output tokens', unit: 'tokens' },
    n_total_tokens: { name: 'Total tokens', unit: 'tokens' },
    agent_time_seconds: { name: 'Agent time', unit: 'seconds', better: 'lower' },
    total_time_seconds: { name: 'Total time', unit: 'seconds', better: 'lower' },
    cost_usd: { name: 'Total run cost', unit: 'usd', better: 'lower' },
    inputTokens: { name: 'Mean input tokens per task', unit: 'tokens', better: 'lower' },
    cachedTokens: { name: 'Mean cached tokens per task', unit: 'tokens' },
    outputTokens: { name: 'Mean output tokens per task', unit: 'tokens', better: 'lower' },
    totalTokens: { name: 'Mean total tokens per task', unit: 'tokens', better: 'lower' },
    mean_cost_usd_per_task: { name: 'Mean cost per task', unit: 'usd', better: 'lower' },
    mean_total_time_seconds_per_task: { name: 'Mean total time per task', unit: 'seconds', better: 'lower' },
    mean_agent_time_seconds_per_task: { name: 'Mean agent time per task', unit: 'seconds', better: 'lower' },
    cache_hit_rate: { name: 'Cache hit rate', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = parseCsv(await fetchText(FEED)).filter((r) => r['benchmark.name'] === 'ITBench AA');
    if (data.length < 10) throw new Error('Expected at least ten ITBench AA runs');
    const rows = data.map((r): LeaderboardRow => {
      const model = r['model.name'];
      const harness = [r['harness.name'], r['harness.version']].filter(Boolean).join(' ');
      const rawScore = Number(r['metrics.score']);
      const metrics: Record<string, number> = {};
      for (const [k, raw] of Object.entries(r)) {
        if (!k.startsWith('metrics.') || k === 'metrics.score' || !raw.trim()) continue;
        const val = Number(raw);
        if (!Number.isFinite(val)) continue;
        const key = TOKEN_KEYS[k.slice(8)] ?? k.slice(8);
        metrics[key] = key === 'cache_hit_rate' && val <= 1 ? val * 100 : val;
      }
      if (!model || !harness || !Number.isFinite(rawScore) || !('mean_cost_usd_per_task' in metrics) || !('outputTokens' in metrics)) {
        throw new Error(`Missing ITBench AA result for ${model}`);
      }
      const setting = [
        r['configuration.configuration_label'],
        r['configuration.reasoning_effort'],
        r['model.precision'],
        r['harness.skills'] && r['harness.skills'] !== '[]' ? r['harness.skills'] : '',
      ].filter(Boolean).join(', ') || undefined;
      const open = r['model.is_oss'] === 'True';
      const numParams = Number(r['model.num_params']);
      return {
        model,
        harness,
        setting,
        score: rawScore * 100,
        cost: metrics.mean_cost_usd_per_task,
        tokens: metrics.outputTokens,
        open,
        params: open && Number.isFinite(numParams) && numParams > 0 ? numParams : undefined,
        metrics,
      };
    });
    return checked(rows, 10);
  },
};

export default board;
