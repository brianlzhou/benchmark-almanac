import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL='https://evals.futuresearch.ai/';
const board:Leaderboard={benchmark:'deep-research-bench-futuresearch',url:URL+'#drb',feed:URL,
 terms:'Official FutureSearch results; source terms apply and the Almanac credits and links the source.',
 chart:{title:'Research score vs. cost',x:{key:'cost',label:'Cost per task',unit:'$',better:'lower'},y:{key:'score',label:'Score',better:'higher'}},
 async fetch(){
  const html=await fetchText(URL);const t=tables(html).find(t=>t[0].some(c=>c.text==='Runtime (s)'));
  if(!t)throw new Error('DRB table missing');const rows:LeaderboardRow[]=[];
  for(const r of t.slice(1)){
   const score=num(r[1]?.text);if(score===undefined)continue;
   const m=r[0].text.match(/^(.*?)\s+\(([^)]+)\)$/);let model=m?m[1]:r[0].text;
   if(/^(Opus|Sonnet|Haiku) /.test(model))model='Claude '+model;
   if(/^(Gemini[- ]2\.5[- ](?:Pro|Flash)|GPT-4o|GPT-4o-mini|DeepSeek[- ]R1)$/i.test(model))model+=' (snapshot unspecified)';
   rows.push({model,setting:m?.[2],score,cost:num(r[2].text),metrics:{latency:num(r[3].text)!}});
  }
  if(!rows.length)throw new Error('No DRB scores');return rows;
 }};
export default board;
