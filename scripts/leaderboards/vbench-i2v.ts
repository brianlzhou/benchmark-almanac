// VBench image-to-video: Gradio's public config embeds the current complete table.
// Total Score (percent) is the headline. Quality, I2V and the published dimensions
// remain metrics. Text-to-video, VBench2 and trustworthiness tabs are separate scopes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const PAGE='https://huggingface.co/spaces/Vchitect/VBench_Leaderboard';
const FEED='https://vchitect-vbench-leaderboard.hf.space/config';
interface Table {headers:string[];data:unknown[][]}
export default {
 benchmark:'vbench-i2v',url:PAGE,feed:FEED,
 terms:'Public Gradio configuration published by Vchitect; the VBench repository uses Apache-2.0, and the almanac credits and links the source.',
 async fetch(){
  const cfg=await fetchJson<{components:{type:string;props:{value?:Table}}[]}>(FEED);
  const t=cfg.components.filter(c=>c.type==='dataframe').map(c=>c.props.value).find(t=>t?.headers.includes('Total Score')&&t.headers.includes('I2V Score'));
  if(!t)throw new Error('VBench I2V total-score table missing');
  const rows:LeaderboardRow[]=[];
  for(const r of t.data){
   const model=String(r[0]??'').replace(/^\[([^\]]+)\]\([\s\S]*\)$/,'$1').trim();
   const score=num(String(r[t.headers.indexOf('Total Score')]??''));
   if(!model || score===undefined)continue;
   const metrics:Record<string,number>={};
   for(let i=0;i<t.headers.length;i++){
    if(i<7 || t.headers[i]==='Selected Score')continue;
    const v=num(String(r[i]??''));if(v!==undefined)metrics[t.headers[i]]=v;
   }
   const date=String(r[t.headers.indexOf('Date')]??'');
   rows.push({model,score,date:/^\d{4}-\d{2}-\d{2}$/.test(date)?date:undefined,metrics});
  }
  if(!rows.length)throw new Error('VBench has no scored models');
  return rows;
 }
} satisfies Leaderboard;
