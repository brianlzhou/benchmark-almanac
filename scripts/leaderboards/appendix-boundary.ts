// Appendix Boundary. Models extract answers from documents containing clean text, benign notes, or conflicting instructions.
// Kaggle's leaderboard download supplies the Appendix Boundary score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "rudots";
const slug = "prompt-injection-score-audit";
const board: Leaderboard = {
  benchmark: "appendix-boundary",
  url: "https://www.kaggle.com/benchmarks/rudots/prompt-injection-score-audit",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  aliases: {"Gemini 2.5 Flash": "gemini-2-5-flash-jun-2025"},
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "Appendix Boundary", 1);
    if (rows.length < 1) throw new Error(`Appendix Boundary: expected at least 1 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
