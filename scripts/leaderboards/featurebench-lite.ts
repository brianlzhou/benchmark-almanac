// The public 30-task Lite leaderboard ranks passed-test percentages and reports fully resolved-task percentages separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/LiberCoders/FeatureBench/main/README.md";
const board: Leaderboard = {
 benchmark: "featurebench-lite", url: "https://github.com/LiberCoders/FeatureBench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('%PASSED'));if(!t)throw new Error('Missing FeatureBench table');const rows:LeaderboardRow[]=[];
for(const r of t.rows){const score=num(r[3]);if(score===undefined)continue;const resolved=num(r[4]);rows.push({model:r[1],harness:r[2],score,setting:'Lite; 30 tasks',metrics:resolved===undefined?undefined:{resolved}});}return rows;
 },
};
export default board;
