// Vals compares inference providers on 165 agent tasks. Its chart data gives overall accuracy, cost and one standard error for each provider and model.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { valsView } from './vals-index.ts';

const FEED = "https://www.vals.ai/benchmarks/inference_provider";
interface Run {
  accuracy: number; stderr: number; cost_per_test: number; latency: number; provider: string; reasoning_effort?: string;
  gateway_metrics: { task_count: number; tokens: { out_tokens: { total: number | null } };
    ttft_ms: Stats; ttfat_ms: Stats; approximate_tps: Stats };
}
interface Stats { p50: number; p95: number }
const parts = { finance_agent_v2: 'Finance Agent v2', vibe_code_bench: 'Vibe Code Bench', legal_research: 'Legal Research' };

const board: Leaderboard = {
  benchmark: "vals-inference-provider-index",
  url: "https://www.vals.ai/benchmarks/inference_provider",
  feed: FEED,
  terms: "The page lists copyright for Vals AI and gives no reuse license. https://www.vals.ai/benchmarks/inference_provider",
  parts,
  stats: {
    latency: { name: 'Latency per test', unit: 'ms', better: 'lower' },
    firstTokenMedian: { name: 'Time to first token median', unit: 'seconds', better: 'lower' },
    firstTokenP95: { name: 'Time to first token P95', unit: 'seconds', better: 'lower' },
    firstAnswerMedian: { name: 'Time to first answer median', unit: 'seconds', better: 'lower' },
    firstAnswerP95: { name: 'Time to first answer P95', unit: 'seconds', better: 'lower' },
    generationMedian: { name: 'Generation speed median', unit: 'tokens/s', better: 'higher' },
  },
  async fetch() {
    const view = await valsView(await fetchText(FEED));
    const tasks = view?.tasks as Record<string, Record<string, Run>> | undefined;
    if (!tasks || Object.keys(tasks.overall).length < 10) throw new Error('Incomplete Vals provider board');
    return Object.entries(tasks.overall).map(([key, r]) => {
      const endpoint = key.split('/').at(-1)!.toLowerCase();
      const model = { 'deepseek-v4p1-flash': 'DeepSeek V4.1 Flash', 'deepseek-v4.1-flash': 'DeepSeek V4.1 Flash',
        'kimi-k3': 'Kimi K3', 'minimax-m3': 'MiniMax M3' }[endpoint];
      if (!model || !r.provider || ![r.accuracy, r.stderr, r.cost_per_test].every(Number.isFinite)) throw new Error('Unknown Vals run ' + key);
      const gateway = r.gateway_metrics;
      const metrics: Record<string, number> = { latency: r.latency, stderr: r.stderr,
        firstTokenMedian: gateway.ttft_ms.p50 / 1000, firstTokenP95: gateway.ttft_ms.p95 / 1000,
        firstAnswerMedian: gateway.ttfat_ms.p50 / 1000, firstAnswerP95: gateway.ttfat_ms.p95 / 1000,
        generationMedian: gateway.approximate_tps.p50 };
      for (const task of Object.keys(parts)) {
        const accuracy = tasks[task]?.[key]?.accuracy;
        if (!Number.isFinite(accuracy)) throw new Error('Missing Vals task ' + task);
        metrics[task] = accuracy;
      }
      const total = gateway.tokens.out_tokens.total;
      return { model, harness: r.provider, setting: r.reasoning_effort || undefined, score: r.accuracy, cost: r.cost_per_test,
        low: r.accuracy - r.stderr, high: r.accuracy + r.stderr, metrics,
        tokens: total == null ? undefined : total / gateway.task_count };
    });
  },
};
export default board;
