// New Synonym Benchmark uses the Swedish Benchmarks dashboard's default Task Score.
// The page combines normalized task performance and latency, and separately reports raw accuracy.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const feed = "https://markovic.com/swedish_benchmark_V1.1.html";
type Model = { model: string; raw_task_score?: number; task_score: number; accuracy: number; avg_latency_seconds: number;
  examples: number; correct: number; valid_predictions: number; valid_rate: number; secondary_score?: number; error_metric?: number };
type Dashboard = { leaderboard_accuracy_weight: number; benchmarks: { id: string; models: Model[] }[] };
export async function swedishTask(url: string, id: string, minimum: number) {
  const data = jsonAfter<Dashboard>(await fetchText(url), 'const dashboard = ');
  const rows = data.benchmarks.find(b => b.id === id)?.models;
  if (!rows || rows.length < minimum) throw new Error('Incomplete Swedish benchmark: ' + id);
  const raw = rows.map(r => r.raw_task_score ?? r.task_score);
  const latency = rows.map(r => r.avg_latency_seconds);
  const min = Math.min(...raw), max = Math.max(...raw), fastest = Math.min(...latency), slowest = Math.max(...latency);
  const weight = data.leaderboard_accuracy_weight;
  if (![min, max, fastest, slowest, weight].every(Number.isFinite)) throw new Error('Invalid dashboard scores');
  return rows.map((r, i) => {
    const quality = max > min ? (raw[i] - min) / (max - min) : 1;
    const speed = slowest > fastest ? (slowest - latency[i]) / (slowest - fastest) : 1;
    return { model: r.model, score: 100 * (weight * quality + (1 - weight) * speed), metrics: {
      rawTaskScore: raw[i], accuracy: r.accuracy * 100, latency: latency[i], examples: r.examples, correct: r.correct,
      validPredictions: r.valid_predictions, validRate: r.valid_rate * 100,
      ...(typeof r.secondary_score === 'number' ? { secondaryScore: r.secondary_score } : {}),
      ...(typeof r.error_metric === 'number' ? { errorMetric: r.error_metric } : {}),
    } };
  });
}

const board: Leaderboard = {
  benchmark: "new-synonym-benchmark-markovic",
  url: "https://markovic.com/swedish_benchmark_V1.1.html",
  feed,
  terms: "The dashboard embeds the scores in its HTML and gives no separate reuse license. robots.txt allows the feed path.",
  async fetch() {
    return swedishTask(feed, 'new_synonym_benchmark', 23);
  },
};
export default board;
