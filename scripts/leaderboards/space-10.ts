// SpaCE-10: the first main results table publishes Overall for the default single-choice evaluation.
//  This is the authors' headline board. Other answer formats are not alternative rows.
//  The eight spatial capabilities remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2506.07966";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "space-10", static: 'paper',
  parts: {
    entity: { name: 'Entity', group: 'Category' },
    scene: { name: 'Scene', group: 'Category' },
    size: { name: 'Size', group: 'Category' },
    orientation: { name: 'Orientation', group: 'Category' },
    objectState: { name: 'Object state', group: 'Category' },
    position: { name: 'Position', group: 'Category' },
    functional: { name: 'Functional', group: 'Category' },
    spatial: { name: 'Spatial', group: 'Category' },
  },
  url: "https://github.com/VisionXLab/SpaCE-10",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return paperRows(FEED, {"table": 2, "header": "Overall", "score": 10, "width": 11, "min": 46, "metrics": {"entity": 2, "scene": 3, "size": 4, "orientation": 5, "objectState": 6, "position": 7, "functional": 8, "spatial": 9}});
  },
};
export default board;
