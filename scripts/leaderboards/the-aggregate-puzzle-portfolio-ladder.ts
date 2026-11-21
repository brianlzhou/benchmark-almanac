// The Aggregate Puzzle Portfolio Ladder reports Accuracy for each evaluated model.
// The benchmark page loads the maker’s versioned results module.
import type { Leaderboard } from './types.ts';
import { aggregateRows } from './the-aggregate-exotic-fact-recall.ts';

const feed = "https://theaggregate.ai/our-benchmarks/puzzle-portfolio";

const board: Leaderboard = {
  benchmark: "the-aggregate-puzzle-portfolio-ladder",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-puzzle-portfolio-ladder",
  feed,
  terms: "Credit The Aggregate when quoting scores. Bulk republication requires written permission. https://theaggregate.ai/terms robots.txt allows the feed path.",
  stats: { items:{name:'Items',unit:'count'} },
  async fetch() {
    const rows = await aggregateRows(feed, 'puzzle-portfolio', 29);
    // The module dates the whole campaign, without giving an evaluation date for each model.
    return rows.map(({ date, ...row }) => row);
  },
};
export default board;
