// APEX-Agents v1.1: the FAQ identifies Mean Score as the primary ranking metric.
// Keep Pass@1 separately. release_date is the model release, not the run date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const url='https://www.mercor.com/apex/apex-agents-leaderboard/';
const board:Leaderboard={benchmark:'apex-agents-1-1',url,feed:`${url} (__NEXT_DATA__, mean-score, v1.1)`,
 terms:'Mercor terms prohibit automated scraping; the Almanac credits Mercor and links the original source.',
 aliases:{'Muse Wonder 1.0':'muse-wonder'},
 async fetch():Promise<LeaderboardRow[]> {
  const raw=(await fetchText(url)).match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if(!raw)throw new Error('Mercor Next.js data missing');
  const p=JSON.parse(raw).props.pageProps;
  if(p.benchmark.dataLink!=='https://huggingface.co/datasets/mercor/apex-agents-v1.1')throw new Error('APEX-Agents version changed');
  const rows:LeaderboardRow[]=[];
  for(const r of p.leaderboardData)for(const [h,score] of Object.entries(r.score?.['mean-score']??{})) {
   if(typeof score!=='number'||!Number.isFinite(score))continue;
   const metrics:Record<string,number>={};const pass=r.score?.['pass-1']?.[h],margin=r.error?.['mean-score']?.[h];
   if(typeof pass==='number')metrics.passAt1=pass;
   if(typeof margin==='number'){metrics.ciLow=score-margin;metrics.ciHigh=score+margin;}
   if(typeof r.n_samples==='number')metrics.samples=r.n_samples;
   rows.push({model:r.model_name,score,setting:r.effort||undefined,harness:p.harnessOptions.find((x:any)=>x.value===h)?.label??h,metrics});
  }
  if(!rows.length)throw new Error('No APEX-Agents v1.1 rows');return rows;
 }
};
export default board;
