// RetryBudget-24: Policy and JSON Contracts. Models apply retry policies in 24 synthetic cases.
// Kaggle's leaderboard download supplies the (Overall) score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "liwhattao";
const slug = "retrybudget-24-policy-and-json-contracts";
const board: Leaderboard = {
  benchmark: "retrybudget-24-policy-and-json-contracts",
  url: "https://www.kaggle.com/benchmarks/liwhattao/retrybudget-24-policy-and-json-contracts",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {"retrybudget24": {"name": "retrybudget24", "unit": "%"}},
  aliases: {"Gemini 2.5 Flash": "gemini-2-5-flash-jun-2025"},
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 1, {"retrybudget24": {"task": "retrybudget24", "scale": 100, "interval": true}});
    if (rows.length < 1) throw new Error(`RetryBudget-24: Policy and JSON Contracts: expected at least 1 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
