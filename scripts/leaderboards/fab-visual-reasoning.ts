// Fab AI scores visual puzzles by percentage accuracy. Its embedded results separate overall accuracy from the scores for each puzzle type.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fabCore, fabAliases } from './fab-send-pedagogy-benchmark.ts';

const feed = "https://www.fab-ai.org/benchmarks?benchmark=VISUAL_REASONING&cost=10&models=%5B%5D&pageView=table";

const board: Leaderboard = {
  benchmark: "fab-visual-reasoning",
  url: "https://www.fab-ai.org/benchmarks?benchmark=VISUAL_REASONING&cost=10&models=%5B%5D&pageView=table",
  feed,
  terms: "Fab AI marks the leaderboard as all rights reserved. https://www.fab-ai.org/benchmarks?benchmark=VISUAL_REASONING&cost=10&models=%5B%5D&pageView=table The feed host publishes robots.txt at https://www.fab-ai.org/robots.txt.",
  aliases: fabAliases,
  async fetch() {
    return fabCore(board, feed, 'VISUAL_REASONING', 67);
  },
};
export default board;
