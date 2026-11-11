// MMIU overall accuracy with all 52 task metrics.
// Two HTML rows describe each model; frequency and random baselines are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://mmiu-bench.github.io/";
const board: Leaderboard = {
 benchmark: "mmiu", url: "https://mmiu-bench.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text==='Overall');if(!t)throw new Error('Missing MMIU table');
const rows:LeaderboardRow[]=[];
for(let i=2;i<t.length;i+=2){const r=t[i],next=t[i+1],name=r[0]?.text,score=num(r[1]?.text);
 if(!name||/^(Frequency|Random)$/i.test(name)||score===undefined)continue;
 const metrics:Record<string,number>={};for(let j=2;j<r.length;j++){const a=num(r[j]?.text),b=num(next?.[j]?.text);if(a!==undefined)metrics[t[0][j].text]=a;if(b!==undefined)metrics[t[1][j].text]=b;}
 const model=/^(GPT-4[ov]?|Gemini[- ]1\.5[- ](?:Pro|Flash))$/i.test(name)?name+' [snapshot unspecified]':name;
 rows.push({model,score,metrics});}return rows;
 },
};
export default board;
