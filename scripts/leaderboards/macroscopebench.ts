import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL='https://macroscope.com/benchmark';
const board:Leaderboard={benchmark:'macroscopebench',url:URL,feed:URL,
 terms:'Macroscope terms restrict automated extraction; the Almanac credits Macroscope and links the original source.',
 chart:{title:'Score vs. inference cost',x:{key:'cost',label:'Cost per code review',unit:'$',better:'lower'},y:{key:'score',label:'Score',better:'higher'}},
 async fetch(){
  const t=tables(await fetchText(URL)).find(t=>t[0].some(c=>c.text==='Signal / noise'));
  if(!t)throw new Error('Macroscope result table missing');
  const rows:LeaderboardRow[]=[];
  for(const r of t.slice(1)){
   const score=num(r[1]?.text);if(score===undefined)continue;
   const m=r[0].text.match(/^(.*?)\s+((?:max|xhigh|high|medium|low|none|default|minimal) effort)$/i);
   const duration=r[6]?.text||'';const seconds=[...duration.matchAll(/([\d.]+)(h|m|s)/g)].reduce((sum,m)=>sum+Number(m[1])*({h:3600,m:60,s:1}[m[2]]||1),0);
   rows.push({model:m?m[1]:r[0].text,setting:m?.[2],score,cost:num(r[5].text),metrics:{recall:num(r[2].text)!,precision:num(r[3].text)!,signalNoise:num(r[4].text)!,latency:seconds}});
  }
  if(!rows.length)throw new Error('No Macroscope scores');return rows;
 }};
export default board;
