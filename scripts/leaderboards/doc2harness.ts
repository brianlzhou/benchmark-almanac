// Doc2Harness: All is the full 328-case pass rate in percent. The paper averages three harness builds per model. Category rates remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2610.20344";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "doc2harness",
  url: "https://github.com/YuyaoGe/doc2harness",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 2, "header": "Headless", "score": 8, "width": 9, "min": 19, "skip": "^Mean$", "metrics": {"permissions": 1, "fileOps": 2, "session": 3, "direct": 4, "headless": 5, "interactive": 6, "other": 7}});
  },
};
export default board;
