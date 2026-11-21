// Fab AI tests Kiswahili linguistic knowledge with 135 questions. Its page embeds percentage accuracy,
// question counts and answer-format statistics in the foundational literacy chart data.
import type { Leaderboard } from './types.ts';
import { fabAccuracy } from './fab-decodability-assessment.ts';

const feed = "https://www.fab-ai.org/benchmarks?benchmark=LK-sw&benchmarkType=foundational-literacy&cost=10&dataset=&modelMode=default&models=%5B%5D&pageView=table";

const board: Leaderboard = {
  benchmark: "fab-linguistic-knowledge",
  url: "https://www.fab-ai.org/benchmarks?benchmark=LK-sw&benchmarkType=foundational-literacy&cost=10&dataset=&modelMode=default&models=%5B%5D&pageView=table",
  feed,
  terms: "Fab AI marks the leaderboard as all rights reserved. robots.txt allows the feed path.",
  async fetch() {
    return fabAccuracy(feed, 'LK-sw', 121);
  },
};
export default board;
