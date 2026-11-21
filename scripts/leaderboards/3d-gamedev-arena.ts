// 3D GameDev Arena ranks coding agents by player preference. Its ratings API reports the overall score on a 0 to 100 scale.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://110.238.108.113/api/ratings";

interface Ratings {
  official_rank: Record<string, number | null>;
  overall_score: Record<string, number>;
  configuration_details: Record<string, { model: string; harness: string; effort: string }>;
  estimator_metadata: { preference_ci95: Record<string, { lower: number; upper: number }> };
  generation_success_rate: Record<string, number>;
  avg_output_tokens_m: Record<string, number>;
  token_display_averages?: Record<string, { avg_output_tokens_m?: number }>;
  avg_price_rmb: Record<string, number>;
  avg_time_per_task_m: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: "3d-gamedev-arena",
  url: "https://110.238.108.113/",
  feed: FEED,
  terms: "The live arena gives no reuse terms. Eleven scored configurations represent ten distinct model names on 2026-11-20. https://baibizhe.github.io/gamearena/ The arena serves no robots.txt.",
  async fetch() {
    const data = await fetchJson<Ratings>(FEED);
    const rows = Object.keys(data.official_rank).filter((id) => data.official_rank[id] != null).map((id) => {
      const score = data.overall_score[id];
      const { model, harness, effort } = data.configuration_details[id];
      const ci = data.estimator_metadata.preference_ci95[id];
      const output = data.token_display_averages?.[id]?.avg_output_tokens_m ?? data.avg_output_tokens_m[id];
      if (!model || !harness || !Number.isFinite(score)) throw new Error(`Incomplete rating for ${id}`);
      const metrics: Record<string, number> = {};
      if (id in data.generation_success_rate) metrics.generationSuccess = data.generation_success_rate[id] * 100;
      if (id in data.avg_price_rmb) metrics.priceRmb = data.avg_price_rmb[id];
      if (id in data.avg_time_per_task_m) metrics.latency = data.avg_time_per_task_m[id] * 60;
      return { model, harness, setting: effort || undefined, score, low: ci?.lower, high: ci?.upper,
        tokens: output == null ? undefined : Math.round(output * 1e6), metrics };
    });
    if (rows.length < 11) throw new Error(`Expected at least 11 scored configurations, found ${rows.length}`);
    return rows;
  },
};
export default board;
