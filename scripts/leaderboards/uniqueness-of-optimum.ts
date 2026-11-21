// Uniqueness of Optimum ranks models by the board's (Overall) score, expressed as a percentage.
// Kaggle publishes the model rows and their task results in its leaderboard download.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const owner = "dimitarkretski";
const slug = "uniqueness-of-optimum";
const board: Leaderboard = {
  benchmark: "uniqueness-of-optimum",
  url: "https://www.kaggle.com/benchmarks/dimitarkretski/uniqueness-of-optimum",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {
    "uniqueness_of_optimum": "uniqueness_of_optimum"
  },
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 100, {
      "uniqueness_of_optimum": {
        "task": "uniqueness_of_optimum",
        "scale": 100,
        "interval": true
      }
    });
    if (rows.length < 1) throw new Error(`Expected at least 1 ranked rows, found ${rows.length}`);
    for (const key of Object.keys(board.parts!)) {
      if (!rows.some(row => Number.isFinite(row.metrics?.[key]))) throw new Error(`Missing Kaggle column ${key}`);
    }
    return rows;
  },
};
export default board;
