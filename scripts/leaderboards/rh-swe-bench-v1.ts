// Red Hat evaluates agents on 357 enterprise software issues. Its results CSV gives the fraction solved for each model and harness.
// The original RH SWE-Bench and the later v1.1 have separate labels in the same file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard/resolve/main/results.csv";

const tokenKeys: Record<string, string> = {
  mean_tokens_per_task: 'totalTokens',
  mean_input_tokens_per_task: 'inputTokens',
  mean_output_tokens_per_task: 'outputTokens',
  mean_cache_tokens_per_task: 'cachedTokens',
};

const board: Leaderboard = {
  benchmark: "rh-swe-bench-v1",
  url: "https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard",
  feed: FEED,
  terms: "The Space lists mit for its repository. https://huggingface.co/spaces/red-hat-emerging-technologies/coding-agent-leaderboard/blob/main/README.md",
  aliases: {
    "Nemotron-3-Super-120B-NVFP4": "nemotron-3-super",
    "Qwen3.6-27B-FP8": "qwen3-6-27b"
  },
  async fetch() {
    const data = parseCsv(await fetchText(FEED)).filter(r => r['benchmark.name'] === 'RH SWE-Bench');
    if (data.length < 11) throw new Error('Expected at least eleven RH SWE-Bench v1 runs');
    return data.map((r): LeaderboardRow => {
      const model = r['model.name'];
      const harness = [r['harness.name'], r['harness.version']].filter(Boolean).join(' ');
      const metrics: Record<string,number> = {};
      for (const [k,raw] of Object.entries(r)) {
        if (k.startsWith('metrics.') && raw.trim() && Number.isFinite(Number(raw))) metrics[tokenKeys[k.slice(8)] ?? k.slice(8)] = Number(raw);
      }
      if (!model || !harness || !Number.isFinite(metrics.score) || !('mean_cost_usd_per_task' in metrics) || !('outputTokens' in metrics)) throw new Error('Missing RH SWE-Bench result for '+model);
      const setting = [r['configuration.configuration_label'],r['configuration.reasoning_effort'],r['model.precision'],r['harness.skills'] !== '[]' ? r['harness.skills'] : ''].filter(Boolean).join(', ');
      return {model, harness, setting, score: metrics.score*100, cost: metrics.mean_cost_usd_per_task, tokens: metrics.outputTokens, metrics, open: r['model.is_oss'] === 'True'};
    });
  },
};
export default board;
