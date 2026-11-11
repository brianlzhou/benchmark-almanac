// LIBERO-MAX: Max Dynamic is success on the complete dynamic test suite described by this record.
// Max Base and Lite results are secondary metrics. No original-scene and changed-scene aggregate is invented.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://arxiv.org/html/2609.36518";
import { paperRows } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "libero-max",
  url: "https://github.com/liberomax/LIBERO-MAX",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows = await paperRows(FEED,{table:9,header:'Max Dynamic',score:3,width:7,min:14,metrics:{baseSuccess:1,liteDynamic:4}});
    return rows.map(r => r.model.startsWith('π') ? {...r,model:'pi0.5'} : r);
  },
};
export default board;
