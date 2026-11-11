// dfbench has separate tracks without a combined score. Use the page default Detection recall.
// Differential-analysis recall is a secondary metric, never a competing row.
// Parallel HTML table fragments share model/effort rows; retain task costs and scope/category metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://depthfirst.com/research/dfbench";
const board: Leaderboard = {
 benchmark: "dfbench", url: "https://depthfirst.com/research/dfbench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const ts=tables(await fetchText(FEED));if(ts.length<8||ts[0][0]?.[0]?.text!=='Model')throw new Error('dfbench schema changed');const rows:LeaderboardRow[]=[];
if(ts.some(t=>t.length!==ts[0].length))throw new Error('dfbench fragments misaligned');
for(let i=2;i<ts[0].length;i++){const model=ts[0][i][0]?.text,effort=ts[0][i][1]?.text;if(!model)continue;
 for(const [track,table]of [['Detection',1]]as const){const score=num(ts[table][i][1]?.text);if(score===undefined)continue;const metrics:Record<string,number>={};
 const differential=num(ts[6][i][1]?.text);if(differential!==undefined)metrics.differentialRecall=differential;
 const groups=table===1?[2,3,4,5]:[7];for(const g of groups)for(let j=0;j<ts[g][i].length;j++){const v=num(ts[g][i][j].text);if(v!==undefined)metrics[ts[g][1][j].text]=v;}
 rows.push({model,score,setting:effort||undefined,cost:num(ts[table][i][0]?.text),metrics});}
}return rows;
 },
};
export default board;
