// 3DSRBench: use the project page's first/default 3DSRBench-real overall accuracy.
// Common/uncommon viewpoints are subscores, retained as metrics. The conflicting dataset-card table
// is excluded so each model has one published evaluation protocol, not competing source settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://3dsrbench.github.io/";
const board: Leaderboard = {
 benchmark: "3dsrbench", url: "https://3dsrbench.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const rows:LeaderboardRow[]=[];const safe=(s:string)=>/^(GPT-4o|Gemini.*Pro|Gemini 2\.0 Flash)$/i.test(s)?s+' [snapshot unspecified]':s;
const ts=tables(await fetchText(FEED));
for(const [i,t] of ts.slice(0,2).entries())for(const r of t.slice(2)){if(/^Random/i.test(r[0]?.text??''))continue;const model=safe(r[0].text);if(i===0){const score=num(r[1]?.text);if(score===undefined)continue;const metrics:Record<string,number>={};for(let j=2;j<6;j++){const n=num(r[j]?.text);if(n!==undefined)metrics[t[1][j].text]=n;}rows.push({model,score,metrics});}else if(r.length===4){const row=rows.find(r=>r.model===model);if(row)for(const j of [1,2]){const score=num(r[j].text);if(score!==undefined)row.metrics![j===1?'common_view':'uncommon_view']=score;}}}
if(!rows.length)throw new Error('No 3DSRBench scores');return rows;
 },
};
export default board;
