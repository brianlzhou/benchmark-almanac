// SREGym Lite measures incident resolution. The coding agent Space publishes the fraction solved and per-task operating metrics in its results CSV.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard/resolve/main/results.csv";

const board: Leaderboard = {
  benchmark: "sregym-lite",
  url: "https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard",
  feed: FEED,
  terms: "The Space lists mit for its repository. https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard/blob/main/README.md",
  async fetch() {
    const rows = parseCsv(await fetchText(FEED)).filter(r => r['benchmark.name'] === 'SREGym Lite');
    if (rows.length < 2) throw new Error('Missing SREGym Lite results');
    return rows.map(r => {
      const value = (key: string) => {
        const raw = r['metrics.' + key];
        if (!raw || !Number.isFinite(Number(raw))) throw new Error('Missing SREGym Lite ' + key);
        return Number(raw);
      };
      const model = r['model.name'];
      if (!model || !r['harness.name']) throw new Error('Missing SREGym Lite model or harness');
      return { model, score: value('score') * 100, harness: [r['harness.name'], r['harness.version']].filter(Boolean).join(' '),
        setting: r['configuration.configuration_label'] || r['configuration.reasoning_effort'] || undefined,
        cost: value('mean_cost_usd_per_task'), tokens: value('mean_output_tokens_per_task'), open: r['model.is_oss'] === 'True',
        link: r['environment.url'], metrics: { latency: value('mean_total_time_seconds_per_task'), agentSeconds: value('mean_agent_time_seconds_per_task'),
          inputTokens: value('mean_input_tokens_per_task'), cacheTokens: value('mean_cache_tokens_per_task'),
          tasks: value('n_tasks'), errors: value('n_errors') } };
    });
  },
};
export default board;
