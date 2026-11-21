// MOMENT ranks models by their percentage of valid engineering task answers. The page embeds run totals before animating its score cells.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const feed = "https://moment.corestudio.io/";

const board: Leaderboard = {
  benchmark: "moment-eval",
  stats: { totalTokens: { name: 'Total tokens', unit: 'tokens' }, inferenceSeconds: { name: 'Inference time', unit: 'seconds', better: 'lower' }, validTasks: { name: 'Valid tasks', unit: 'count' }, tasks: { name: 'Tasks', unit: 'count' }, toolCalls: { name: 'Tool calls', unit: 'count' }, calculator: { name: 'Calculator calls', unit: 'count' }, execute_python: { name: 'Python execution calls', unit: 'count' } },
  url: "https://moment.corestudio.io/",
  feed,
  terms: "CORE studio gives a copyright notice and no explicit score reuse license. https://moment.corestudio.io/ The robots.txt route returns a 404 page.",
  costPer: 'run',
  async fetch() {
    type Entry = { display_name: string; reasoning_effort?: string; score_total: number; valid_task_count: number; task_count: number;
      total_cost_usd: number; total_tokens: number; inference_time_ms: number; tool_call_count: number; tool_call_counts_by_name: Record<string, number> };
    const entries = jsonAfter<Entry[]>(nextFlight(await fetchText(feed)), '"entries":');
    if (entries.length < 68) throw new Error('Missing MOMENT configurations');
    return entries.map(r => {
      if (!r.display_name || !(r.task_count > 0) || !Number.isFinite(r.score_total) || Math.abs(r.score_total - 100 * r.valid_task_count / r.task_count) > 0.011) throw new Error('Invalid MOMENT score');
      const model = r.reasoning_effort ? r.display_name.replace(/ (XHigh|High|Medium|Low|Minimal)$/i, '') : r.display_name;
      return { model, setting: r.reasoning_effort ?? undefined, score: r.score_total, cost: r.total_cost_usd,
        metrics: { totalTokens: r.total_tokens, inferenceSeconds: r.inference_time_ms / 1000, validTasks: r.valid_task_count, tasks: r.task_count,
          toolCalls: r.tool_call_count, ...r.tool_call_counts_by_name } };
    });
  },
};

export default board;
