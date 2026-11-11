// TUA-Bench mean success rate converted from fractions to percentages.
// Keeps agent and effort configurations, spread, Pass@1, Pass@5 and All-5.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/facebookresearch/TUA-Bench/main/README.md";
const board: Leaderboard = {
 benchmark: "tua-bench-meta", url: "https://github.com/facebookresearch/TUA-Bench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Success Rate'));if(!t)throw new Error('Missing TUA results');const rows:LeaderboardRow[]=[];
for(const r of t.rows){const score=num(r[3]);if(score===undefined)continue;const metrics:Record<string,number>={};const spread=num(r[3].split('±')[1]);if(spread!==undefined)metrics['reported spread (%)']=spread*100;for(const [i,k]of [[4,'Pass@1'],[5,'Pass@5'],[6,'All-5']]as const){const v=num(r[i]);if(v!==undefined)metrics[k]=v;}
 rows.push({model:r[1],score:score*100,harness:r[0],setting:r[2],metrics});}return rows;
 },
};
export default board;
