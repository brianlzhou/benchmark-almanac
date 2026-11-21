// RTLLM 2 reports the percentage of designs passing functional simulation on the first attempt. RTLBench publishes the baseline table as CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/ArmmyC/RTLBench/main/reports/baseline_v0.1_public_rtl_benchmarks.csv";

const board: Leaderboard = {
  benchmark: "rtllm-2",
  url: "https://github.com/ArmmyC/RTLBench/blob/main/reports/baseline_v0.1_public_rtl_benchmarks.md#functional-rtl-generation",
  feed,
  terms: "The repository gives no explicit license for redistributing the score table. https://github.com/ArmmyC/RTLBench The feed host returns no robots.txt.",
  stats: { functional_pass_rate: { name: 'Functional pass rate', unit: '%', better: 'higher' }, syntax_pass_rate: { name: 'Syntax pass rate', unit: '%', better: 'higher' } },
  aliases: {"qwen36-27b": "qwen3-6-27b", "qwen36-35b-a3b": "qwen-3-6-35b-a3b", "qwen25-coder-32b": "qwen2-5-coder-32b-instruct"},
  async fetch() {
    const records = parseCsv(await fetchText(feed)).filter(r => r.benchmark === "rtllm2" && r.baseline === 'baseline_v0_1');
    const models = new Map<string, Record<string, number>>();
    for (const record of records) {
      const { model, metric, value } = record;
      if (!model || !metric || !value || !Number.isFinite(Number(value))) throw new Error('Missing baseline result');
      const metrics = models.get(model) ?? {};
      metrics[metric] = Number(value) * (metric.endsWith('_rate') ? 100 : 1);
      models.set(model, metrics);
    }
    if (models.size < 5) throw new Error('Incomplete baseline');
    return Array.from(models, ([model, metrics]) => {
      const score = metrics["functional_pass_rate"];
      if (!Number.isFinite(score)) throw new Error('Missing headline score');
      return { model, score, metrics };
    });
  },
};
export default board;
