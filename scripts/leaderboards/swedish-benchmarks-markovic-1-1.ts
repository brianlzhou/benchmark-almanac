// Markovic ranks Swedish language models by a coverage-adjusted average across 13 benchmarks.
// The dashboard embeds its overall scores and formats them as percentages at the default slider weights.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const feed = "https://markovic.com/swedish_benchmark_V1.1.html";
type Row = { model: string; overall_score: number; coverage: number; avg_accuracy: number; invalid_predictions: number;
  avg_latency_seconds: number; benchmark_scores: { benchmark: string; score: number }[] };

const board: Leaderboard = {
  benchmark: "swedish-benchmarks-markovic-1-1",
  url: "https://markovic.com/swedish_benchmark_V1.1.html",
  feed,
  terms: "The dashboard embeds the scores in its HTML and gives no separate reuse license. robots.txt allows the feed path.",
  stats: {
    coverage: { name: 'Coverage', unit: '%', better: 'higher' },
    accuracy: { name: 'Average accuracy', unit: '%', better: 'higher' },
    latencySeconds: { name: 'Average latency', unit: 'seconds', better: 'lower' },
    invalidPredictions: { name: 'Invalid predictions', unit: 'count' },
  },
  async fetch() {
    const data = jsonAfter<{ leaderboard: Row[]; benchmarks: {id: string; label: string}[] }>(await fetchText(feed), 'const dashboard = ');
    if (data.leaderboard.length < 23 || data.benchmarks.length < 13) throw new Error('Incomplete Swedish suite');
    board.parts = Object.fromEntries(data.benchmarks.map(b => [b.id, { name: b.label, unit: '%' }]));
    return data.leaderboard.map(r => {
      if (!r.model || !Number.isFinite(r.overall_score)) throw new Error('Invalid overall score');
      const metrics = Object.fromEntries(r.benchmark_scores.map(s => [s.benchmark, 100 * s.score]));
      return { model: r.model, score: 100 * r.overall_score, metrics: { ...metrics, coverage: 100*r.coverage, accuracy: 100*r.avg_accuracy,
        latencySeconds: r.avg_latency_seconds, invalidPredictions: r.invalid_predictions } };
    });
  },
};
export default board;
