// dependency-bench. Models reason about build dependencies, retries, and failures in continuous integration pipelines.
// Kaggle's leaderboard download supplies the (Overall) score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "muhammadowaiswarsi";
const slug = "dependency-bench";
const board: Leaderboard = {
  benchmark: "dependency-bench",
  url: "https://www.kaggle.com/benchmarks/muhammadowaiswarsi/dependency-bench",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {"dependency_benchmark": {"name": "dependency_benchmark", "unit": "%"}},
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 100, {"dependency_benchmark": {"task": "dependency_benchmark", "scale": 100, "interval": true}});
    if (rows.length < 1) throw new Error(`dependency-bench: expected at least 1 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
