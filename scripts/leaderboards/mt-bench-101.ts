// MT-Bench-101: main table Avg. on the full dialogue suite, on the original 1 to 10 scale. Thirteen ability scores remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2402.14762";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "mt-bench-101",
  url: "https://arxiv.org/abs/2402.14762",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 2, "header": "Perceptivity", "score": 1, "width": 15, "min": 18, "metrics": {"contextMemory": 2, "separateInput": 3, "anaphora": 4, "topicShift": 5, "confusion": 6, "rephrasing": 7, "followup": 8, "selfCorrection": 9, "selfAwareness": 10, "math": 11, "generalReasoning": 12, "intent": 13, "proactive": 14}});
  },
};
export default board;
