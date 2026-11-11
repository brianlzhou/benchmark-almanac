// VL-RewardBench: Macro Average Accuracy is the authors recommended headline metric for the imbalanced categories. Overall accuracy remains a metric. The main evaluation uses five votes.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2411.17451";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "vl-rewardbench",
  url: "https://vl-rewardbench.github.io/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 1, "header": "Macro Average Accuracy", "score": 5, "width": 6, "min": 16, "metrics": {"overallAccuracy": 4, "general": 1, "hallucination": 2, "reasoning": 3}});
  },
};
export default board;
