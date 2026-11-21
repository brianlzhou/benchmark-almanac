// The Aggregate ranks chart predictions by mean log-scale root mean squared error. The chart recall JSON includes shape correlation and coverage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://theaggregate.ai/benchmarks/chart-recall.json";

const board: Leaderboard = {
  benchmark: "the-aggregate-chart-recall",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-chart-recall",
  feed,
  terms: "Credit The Aggregate when quoting or charting scores. Bulk republication requires written permission. https://theaggregate.ai/terms The feed host publishes robots.txt at https://theaggregate.ai/robots.txt.",
  stats: {
    shape: { name: 'Shape correlation', unit: 'score', better: 'higher' },
    valid: { name: 'Valid answers', unit: 'count' },
    charts: { name: 'Charts scored', unit: 'count' },
    monthsPerChart: { name: 'Months per chart', unit: 'count' },
    outputTokenLimit: { name: 'Output token limit', unit: 'tokens' },
  },
  aliases: { "DeepSeek V4.1 Flash (1017)": "deepseek-v4-1-flash-1017" },
  async fetch() {
    type Model = { name: string; mean_log10_rmse: number; mean_log10_pearson: number;
      run_configuration: { reasoning: string; valid_answers: number; scored_charts: number; months_per_chart: number; max_output_tokens: number } };
    const data = await fetchJson<{ models: Model[]; run_end: string }>(feed);
    if (data.models.length < 18) throw new Error('Incomplete chart recall standings');
    return data.models.map(r => {
      const run = r.run_configuration;
      if (!r.name || !Number.isFinite(r.mean_log10_rmse)) throw new Error('Missing chart error');
      return { model: r.name, score: r.mean_log10_rmse, date: data.run_end, setting: run.reasoning,
        metrics: { shape: r.mean_log10_pearson, valid: run.valid_answers, charts: run.scored_charts,
          monthsPerChart: run.months_per_chart, outputTokenLimit: run.max_output_tokens } };
    });
  },
};
export default board;
