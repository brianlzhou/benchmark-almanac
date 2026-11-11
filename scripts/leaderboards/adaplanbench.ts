// AdaPlanBench: the main results report whole-benchmark outcome accuracy. Constraint and interaction measurements remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2606.05622";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "adaplanbench",
  url: "https://github.com/JiayuJeff/AdaPlanBench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 8, "header": "Outcome", "score": 1, "width": 8, "min": 10, "metrics": {"validPlanRate": 2, "turns": 3, "awrv": 4, "aurv": 5, "atwc": 6, "atuc": 7}});
  },
};
export default board;
