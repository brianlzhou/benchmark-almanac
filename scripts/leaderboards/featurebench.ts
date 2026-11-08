// FeatureBench Lite percentage of passed tests, the official ranking column.
// Retains fully resolved task percentages and scaffold identity separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/LiberCoders/FeatureBench/main/README.md";
const board: Leaderboard = {
 benchmark: "featurebench", url: "https://github.com/LiberCoders/FeatureBench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('%PASSED'));if(!t)throw new Error('Missing FeatureBench table');const rows:LeaderboardRow[]=[];
for(const r of t.rows){const score=num(r[3]);if(score===undefined)continue;const resolved=num(r[4]);rows.push({model:r[1],harness:r[2],score,setting:'Lite; 30 tasks',metrics:resolved===undefined?undefined:{resolved}});}return rows;
 },
};
export default board;
