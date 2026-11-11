import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL='https://www.frontierswe.com/v1/frogsgame-rl';
const board:Leaderboard={benchmark:'frogsgame-post-training-task',url:URL,feed:URL,
 terms:'Official FrontierSWE V1 archived task results; the Almanac credits and links the source.',
 chart:{title:'Average score vs. tokens',x:{key:'totalTokens',label:'Average total tokens',better:'lower',log:true},y:{key:'score',label:'Average score',unit:'%',better:'higher'}},
 async fetch(){
  const t=tables(await fetchText(URL)).find(t=>t[0].some(c=>c.text==='Avg Score'));
  if(!t)throw new Error('FrogsGame table missing');const rows:LeaderboardRow[]=[];
  for(const r of t.slice(1)){
   const score=num(r[3]?.text);if(score===undefined)continue;
   const tok=r[5].text.match(/([\d.]+)([MK])?/);const time=[...r[6].text.matchAll(/([\d.]+)(h|m|s)/g)].reduce((s,m)=>s+Number(m[1])*({h:3600,m:60,s:1}[m[2]]||1),0);
   const metrics:Record<string,number>={best:num(r[4].text)!,latency:time};if(tok)metrics.totalTokens=Number(tok[1])*(tok[2]==='M'?1e6:tok[2]==='K'?1e3:1);
   rows.push({model:r[1].text,harness:r[2].text,score,metrics});
  }
  if(!rows.length)throw new Error('No FrogsGame scores');return rows;
 }};
export default board;
