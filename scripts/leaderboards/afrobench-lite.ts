// The official Space's default Score: equally weighted task means, rounded to one decimal.
// Require every task, so incomplete runs cannot gain a headline score. Keep published component units.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/McGill-NLP/AfroBench/raw/main/data/leaderboard_json/afrobench_lite.json';
const board:Leaderboard={benchmark:'afrobench-lite',url:'https://huggingface.co/spaces/McGill-NLP/AfroBench',feed:FEED,
 terms:'MIT Space; Hugging Face robots.txt permits the raw results path.',
 async fetch(){
  const data=await fetchJson<Record<string,Record<string,Record<string,number>>>>(FEED);
  const tasks=Object.keys(data);const models=new Set(Object.values(data).flatMap(t=>Object.values(t).flatMap(d=>Object.keys(d))));
  const rows=[];
  for(const model of models){
   const metrics:Record<string,number>={};
   for(const task of tasks){const values=Object.values(data[task]).map(d=>d[model]);if(values.some(v=>!Number.isFinite(v)))continue;metrics[task]=Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10;}
   if(Object.keys(metrics).length!==tasks.length)continue;
   rows.push({model,score:Math.round(Object.values(metrics).reduce((a,b)=>a+b,0)/tasks.length*10)/10,metrics});
  }
  if(tasks.length!==7||rows.length<3)throw new Error('Lite task coverage changed');return rows;
 }};export default board;
