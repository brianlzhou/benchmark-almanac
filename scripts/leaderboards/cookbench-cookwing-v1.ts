// CookWing counts correct runs in five attempts at each of three recipes.
// The published figure supplies the counts, and the article defines overall success as correct runs divided by total runs.
import type { Leaderboard } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';

const feed = "https://cook.redwi.ng/static/blog/cookbench-v1-cooking-quantity-benchmark.png";
const counts: [string, number, number, number][] = [
  ["Gemini 3.1 Pro", 4, 0, 0],
  ["5.6 Sol", 5, 1, 0],
  ["Claude Fable 5", 5, 0, 0],
  ["Claude Opus 4.8", 5, 0, 0],
  ["Claude Opus 4.6", 1, 0, 0],
  ["Claude Sonnet 5", 5, 0, 0],
  ["DeepSeek V4 Pro", 5, 0, 0],
  ["GLM-5.1", 5, 0, 0],
  ["Kimi K3", 5, 0, 0],
];

const board: Leaderboard = {
  benchmark: "cookbench-cookwing-v1",
  url: "https://cook.redwi.ng/blog/cookbench-v1-llm-recipe-quantity-benchmark",
  feed,
  terms: "The maker's results page gives no reuse license. robots.txt allows the feed path.",
  parts: { carbonara: 'Carbonara', pastitsio: 'Pastitsio', melonPan: 'Melon Pan' },
  aliases: { '5.6 Sol': 'gpt-5-6-sol' },
  async fetch() {
    const rows = counts.map(([model, carbonara, pastitsio, melonPan]) => ({
      model, score: (carbonara + pastitsio + melonPan) * 100 / 15, trials: 5,
      metrics: { carbonara: carbonara * 20, pastitsio: pastitsio * 20, melonPan: melonPan * 20 },
    }));
    return checkedImageRows(feed, '82628a7790f2548f70231fdb8163d5a261cb352b3327103da32974d36dfcf612', rows);
  },
};
export default board;
