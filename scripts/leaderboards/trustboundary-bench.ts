// TrustBoundary Bench ranks models by the board's (Overall) score.
// Kaggle publishes the model rows and their task results in its leaderboard download.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const owner = "del=8846f417eeb2987e";
const slug = "trustboundary-bench";
const board: Leaderboard = {
  benchmark: "trustboundary-bench",
  url: "https://www.kaggle.com/benchmarks/del=8846f417eeb2987e/trustboundary-bench",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {
    "trustboundary_authority": {
      "name": "trustboundary_authority",
      "unit": "%"
    }
  },
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 1, {
      "trustboundary_authority": {
        "task": "trustboundary_authority",
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
