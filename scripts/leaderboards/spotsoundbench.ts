// SpotSoundBench: main temporal-grounding table, whole-set mIoU in percent. Recall thresholds remain secondary metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2604.13023";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "spotsoundbench",
  url: "https://loiesun.github.io/spotsound/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 6, "header": "SpotSound-Bench", "score": 9, "width": 13, "min": 10, "metrics": {"recallIoU03": 7, "recallIoU05": 8}});
  },
};
export default board;
