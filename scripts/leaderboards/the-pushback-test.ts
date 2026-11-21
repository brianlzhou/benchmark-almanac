// The Pushback Test ranks models by the board's (Overall) score.
// Kaggle publishes the model rows and their task results in its leaderboard download.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const owner = "markrowset";
const slug = "the-pushback-test";
const board: Leaderboard = {
  benchmark: "the-pushback-test",
  url: "https://www.kaggle.com/benchmarks/markrowset/the-pushback-test",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {
    "pushback_test_parent_triage": {
      "name": "pushback_test_parent_triage",
      "unit": "%"
    }
  },
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 1, {
      "pushback_test_parent_triage": {
        "task": "pushback_test_parent_triage",
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
