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
  async fetch() {
    return swedishTask(feed, 'sveaknow_culture', 23);
  },
};
export default board;
