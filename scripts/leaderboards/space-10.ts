// SpaCE-10: the first main results table publishes Overall for the default single-choice evaluation.
//  This is the authors' headline board. Other answer formats are not alternative rows.
//  The eight spatial capabilities remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2506.07966";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "space-10",
  url: "https://github.com/VisionXLab/SpaCE-10",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 2, "header": "Overall", "score": 10, "width": 11, "min": 46, "metrics": {"entity": 2, "scene": 3, "size": 4, "orientation": 5, "objectState": 6, "position": 7, "functional": 8, "spatial": 9}});
  },
};
export default board;
