// Ego3D-Bench: Avg. RMSE is the lower-is-better distance error selected by the catalog.
// Accuracy is a secondary metric. Ego3D-VLM is the adaptation harness, not another benchmark split.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2509.06266";
import { paperRows, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "ego3d-bench",
  url: "https://raw.githubusercontent.com/vbdi/Ego3D-Bench/main/README.md",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows = await paperRows(FEED, {table:5, header:'RMSE', score:12, width:13, min:26, skip:'^Chance', metrics:{accuracy:9, egoDistanceRMSE:10, objectDistanceRMSE:11}});
    return rows.map(r => r.model.startsWith('Ego3D-VLM ') ? {...r, model:paperModel(r.model.slice(10)), harness:'Ego3D-VLM'} : r);
  },
};
export default board;
