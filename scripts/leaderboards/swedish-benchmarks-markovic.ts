// Markovic combines normalized task scores and latency across ten Swedish tests. The dashboard embeds the default overall score shown as a percentage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const feed = "https://markovic.com/swedish_benchmark_V1.html";

const board: Leaderboard = {
  benchmark: "swedish-benchmarks-markovic",
  url: "https://markovic.com/swedish_benchmark_V1.html",
  feed,
  terms: "The dashboard embeds the scores in its HTML and gives no separate reuse license. https://markovic.com/swedish_benchmark_V1.html The feed host publishes robots.txt at https://markovic.com/robots.txt.",
  aliases: {"google_gemma-4-31b": "gemma-4-31b-it", "qwen_qwen3.6-27b": "qwen3-6-27b", "qwen_qwen3.6-35b-a3b": "qwen-3-6-35b-a3b", "google_gemma-4-26b-a4b": "gemma-4-26b-a4b", "openai_gpt-oss-120b": "gpt-oss-120b", "nvidia_nemotron-3-super": "nemotron-3-super", "openai_gpt-oss-20b": "gpt-oss-20b", "google_gemma-3-27b": "gemma-3-27b", "meta_llama-3.3-70b": "llama-3-3-70b", "zai-org_glm-4.7-flash": "glm-4-7-flash", "mistral-small-4-119b-2603": "mistral-small-4"},
  async fetch() {
    type Result = { model: string; overall_score: number; avg_latency_seconds: number; coverage: number; invalid_predictions: number;
      benchmark_scores: { benchmark: string; score: number }[] };
    const data = jsonAfter<{ model_count: number; benchmarks: { id: string; label: string }[]; leaderboard: Result[] }>(await fetchText(feed), 'const dashboard = ');
    if (data.leaderboard.length < 15 || data.leaderboard.length !== data.model_count) throw new Error('Incomplete Swedish leaderboard');
    board.parts = Object.fromEntries(data.benchmarks.map(b => [b.id, b.label]));
    return data.leaderboard.map(r => {
      if (!r.model || !Number.isFinite(r.overall_score)) throw new Error('Missing overall score');
      const metrics: Record<string, number> = { latency: r.avg_latency_seconds, coverage: 100 * r.coverage, invalid: r.invalid_predictions };
      for (const part of r.benchmark_scores) metrics[part.benchmark] = 100 * part.score;
      return { model: r.model, score: 100 * r.overall_score, metrics };
    });
  },
};
export default board;
