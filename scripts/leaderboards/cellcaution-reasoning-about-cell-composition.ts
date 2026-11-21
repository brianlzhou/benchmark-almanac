// CellCaution: Reasoning About Cell Composition. Models reason about changes in cell populations and decide when the information supports a numerical claim about their composition.
// Kaggle's leaderboard download supplies the (Overall) score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "abhicloudstalk";
const slug = "cellcaution-reasoning-about-cell-composition";
const board: Leaderboard = {
  benchmark: "cellcaution-reasoning-about-cell-composition",
  url: "https://www.kaggle.com/benchmarks/abhicloudstalk/cellcaution-reasoning-about-cell-composition",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {"CellCaution: Reasoning About Cell Composition": {"name": "CellCaution: Reasoning About Cell Composition", "unit": "%"}},
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 1, {"CellCaution: Reasoning About Cell Composition": {"task": "CellCaution: Reasoning About Cell Composition", "scale": 100, "interval": true}});
    if (rows.length < 1) throw new Error(`CellCaution: Reasoning About Cell Composition: expected at least 1 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
