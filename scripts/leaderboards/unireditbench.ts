// UniREditBench: the main in-domain table reports Overall across real-world and game-world edits. Category averages remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2511.01295";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "unireditbench",
  url: "https://maplebb.github.io/UniREditBench/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 4, "header": "Overall", "score": 11, "width": 12, "min": 15, "metrics": {"realWorld": 5, "gameWorld": 10}});
  },
};
export default board;
