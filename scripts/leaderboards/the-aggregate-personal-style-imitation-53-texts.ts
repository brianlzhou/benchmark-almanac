// The Aggregate scores 53 rewrites with an authorship classifier. The first-party benchmark module lists 18 ranked models and three reference scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { aggregateRows } from './the-aggregate-exotic-fact-recall.ts';

const feed = "https://theaggregate.ai/our-benchmarks/write-like-me";

const board: Leaderboard = {
  benchmark: "the-aggregate-personal-style-imitation-53-texts",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-personal-style-imitation-53-texts",
  feed,
  terms: "Credit The Aggregate when quoting scores. Bulk republication requires written permission. https://theaggregate.ai/terms The feed host publishes robots.txt at https://theaggregate.ai/robots.txt.",
  stats: { items: { name: 'Items', unit: 'count' } },
  async fetch() {
    return aggregateRows(feed, 'write-like-me', 18);
  },
};
export default board;
