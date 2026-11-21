// Semantic DLP: Catch the Data Leak. Models search long technical documents for proprietary content.
// Kaggle's leaderboard download supplies the (Overall) score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "karthiksethuraman6";
const slug = "semantic-dlp-catch-the-data-leak";
const board: Leaderboard = {
  benchmark: "semantic-dlp-catch-the-data-leak",
  url: "https://www.kaggle.com/benchmarks/karthiksethuraman6/semantic-dlp-catch-the-data-leak",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {"leak_catch_rate": {"name": "leak_catch_rate", "unit": "%"}},
  aliases: {"Gemini 2.5 Flash": "gemini-2-5-flash-jun-2025"},
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 1, {"leak_catch_rate": {"task": "leak_catch_rate", "scale": 100, "interval": true}});
    if (rows.length < 1) throw new Error(`Semantic DLP: Catch the Data Leak: expected at least 1 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
