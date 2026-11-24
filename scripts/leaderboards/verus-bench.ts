// Verus-Bench measures LLM-based proof synthesis on 150 algorithm-level Rust verification tasks.
// The headline score is the published percentage of tasks solved.
// The importer reads the official leaderboard JSON used by the public page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://microsoft.github.io/verus-proof-synthesis/';
const FEED = 'https://microsoft.github.io/verus-proof-synthesis/data/verus-bench-results.json';
interface Submission { system_name?: string; model?: string; date?: string; verified?: boolean; paper_url?: string; code_url?: string; results?: { percent_solved?: number; solved?: number; total?: number; avg_time_seconds?: number; avg_llm_calls?: number; total_cost_usd?: number }; breakdown?: { category?: string; solved?: number; total?: number }[] }
const board: Leaderboard = {
  benchmark: 'verus-bench', url: PAGE, feed: FEED,
  terms: 'The Verus Proof Synthesis repository is MIT licensed and publishes this leaderboard JSON.',
  harnesses: 'system',
  verified: 'verified by the Verus-Bench maintainers',
  parts: { cloverbench: { name: 'CloverBench', group: 'Source' }, diffy: { name: 'Diffy', group: 'Source' }, mbpp: { name: 'MBPP', group: 'Source' }, misc: { name: 'Misc', group: 'Source' } },
  stats: {
    solved: { name: 'Tasks solved', unit: 'count', better: 'higher' },
    avgTimeSeconds: { name: 'Average time per task', unit: 'seconds', better: 'lower' },
    avgLlmCalls: { name: 'Average LLM calls per task', unit: 'count', better: 'lower' },
    totalCostUsd: { name: 'Total run cost', unit: 'usd', better: 'lower' },
  },
  async fetch() {
    const data = await fetchJson<{ submissions?: Submission[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const submission of data.submissions ?? []) {
      const result = submission.results;
      if (!submission.system_name || !submission.model || typeof result?.percent_solved !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const part of submission.breakdown ?? []) if (part.category && typeof part.solved === 'number' && typeof part.total === 'number' && part.total > 0) metrics[part.category.toLowerCase()] = part.solved / part.total * 100;
      if (typeof result.solved === 'number' && Number.isFinite(result.solved)) metrics.solved = result.solved;
      if (typeof result.avg_time_seconds === 'number' && Number.isFinite(result.avg_time_seconds)) metrics.avgTimeSeconds = result.avg_time_seconds;
      if (typeof result.avg_llm_calls === 'number' && Number.isFinite(result.avg_llm_calls)) metrics.avgLlmCalls = result.avg_llm_calls;
      if (typeof result.total_cost_usd === 'number' && Number.isFinite(result.total_cost_usd)) metrics.totalCostUsd = result.total_cost_usd;
      rows.push({ model: submission.model, harness: submission.system_name, score: result.percent_solved, date: submission.date, verified: submission.verified, link: submission.paper_url ?? submission.code_url, cost: typeof result.total_cost_usd === 'number' && result.total ? result.total_cost_usd / result.total : undefined, metrics });
    }
    if (rows.length < 2) throw new Error(`Verus-Bench: ${rows.length} rows, expected at least 2`);
    return rows;
  },
};
export default board;
