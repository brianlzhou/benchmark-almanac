// Doc2Harness: All is the full 328-case pass rate in percent. The paper averages three harness builds per model. Category rates remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2610.20344";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "doc2harness",
  parts: {
    permissions: { name: 'Permissions', group: 'Category' },
    fileOps: { name: 'File operations', group: 'Category' },
    session: { name: 'Session', group: 'Category' },
    direct: { name: 'Direct', group: 'Category' },
    headless: { name: 'Headless', group: 'Category' },
    interactive: { name: 'Interactive', group: 'Category' },
    other: { name: 'Other', group: 'Category' },
  },
  url: "https://github.com/YuyaoGe/doc2harness",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 2, "header": "Headless", "score": 8, "width": 9, "min": 19, "skip": "^Mean$", "metrics": {"permissions": 1, "fileOps": 2, "session": 3, "direct": 4, "headless": 5, "interactive": 6, "other": 7}});
  },
};
export default board;
