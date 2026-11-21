// Does the answer survive disagreement?. Models answer checkable questions and respond to a user who insists on a plausible wrong answer.
// Kaggle's leaderboard download supplies the (Overall) score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "kumdonalsien";
const slug = "does-the-answer-survive-disagreement";
const board: Leaderboard = {
  benchmark: "does-the-answer-survive-disagreement",
  url: "https://www.kaggle.com/benchmarks/kumdonalsien/does-the-answer-survive-disagreement",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {"answer_survives_disagreement": {"name": "answer_survives_disagreement", "unit": "%"}},
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 100, {"answer_survives_disagreement": {"task": "answer_survives_disagreement", "scale": 100, "interval": true}});
    if (rows.length < 1) throw new Error(`Does the answer survive disagreement?: expected at least 1 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
