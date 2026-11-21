// Can evaluation miss a useful reframing?. Models analyze cases that may benefit from reframing.
// Kaggle's leaderboard download supplies the evaluation-blind-spots-v2 score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "andriivolynets";
const slug = "can-evaluation-miss-a-useful-reframing";
const board: Leaderboard = {
  benchmark: "can-evaluation-miss-a-useful-reframing",
  url: "https://www.kaggle.com/benchmarks/andriivolynets/can-evaluation-miss-a-useful-reframing",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "evaluation-blind-spots-v2", 100);
    if (rows.length < 1) throw new Error(`Can evaluation miss a useful reframing?: expected at least 1 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
