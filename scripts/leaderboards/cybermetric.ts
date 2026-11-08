// CyberMetric: 10k-question accuracy is the full-set headline in percent. Smaller 80, 500, and 2000-question sets remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2402.07688";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "cybermetric",
  url: "https://raw.githubusercontent.com/cybermetric/CyberMetric/main/README.md",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 2, "header": "Accuracy", "score": 7, "width": 8, "min": 25, "metrics": {"accuracy80": 4, "accuracy500": 5, "accuracy2000": 6}});
  },
};
export default board;
