// SveaKnow Culture uses the Swedish Benchmarks dashboard's default Task Score.
// The page combines normalized task performance and latency, and separately reports raw accuracy.
import type { Leaderboard } from './types.ts';
import { swedishTask } from './new-synonym-benchmark-markovic.ts';

const feed = "https://markovic.com/swedish_benchmark_V1.1.html";

const board: Leaderboard = {
  benchmark: "sveaknow-culture",
  url: "https://markovic.com/swedish_benchmark_V1.1.html",
  feed,
  terms: "The dashboard embeds the scores in its HTML and gives no separate reuse license. robots.txt allows the feed path.",
  stats: {
    rawTaskScore: { name: 'Raw task score', unit: 'score', better: 'higher' }, accuracy: { name: 'Accuracy', unit: '%', better: 'higher' },
    latency: { name: 'Average latency', unit: 'seconds', better: 'lower' },
    correct: { name: 'Correct predictions', unit: 'count', better: 'higher' }, validPredictions: { name: 'Valid predictions', unit: 'count', better: 'higher' },
    validRate: { name: 'Valid prediction rate', unit: '%', better: 'higher' }, secondaryScore: { name: 'Secondary score', unit: 'score', better: 'higher' },
  },
  chart: {
    title: 'Accuracy vs. average latency',
    x: { key: 'latency', label: 'Average latency', unit: 's', better: 'lower', log: true },
    y: { key: 'accuracy', label: 'Exact match', unit: '%', better: 'higher' },
    note: 'Exact match accuracy against average latency on a log scale, matching the SveaKnow Culture scatter plot on the Swedish Benchmarks V1.1 dashboard.',
  },
  async fetch() {
    return swedishTask(feed, 'sveaknow_culture', 23);
  },
};
export default board;
