// GhostInk: Honest OCR on Bill Photos. Models read text from phone photos and mask unreadable characters.
// Kaggle's leaderboard download supplies the (Overall) score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "akashgoyal7";
const slug = "ghostink-honest-ocr-on-bill-photos";
const board: Leaderboard = {
  benchmark: "ghostink-honest-ocr-on-bill-photos",
  url: "https://www.kaggle.com/benchmarks/akashgoyal7/ghostink-honest-ocr-on-bill-photos",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {"GhostInk": {"name": "GhostInk", "unit": "%"}},
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 100, {"GhostInk": {"task": "GhostInk", "scale": 100, "interval": true}});
    if (rows.length < 1) throw new Error(`GhostInk: Honest OCR on Bill Photos: expected at least 1 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
