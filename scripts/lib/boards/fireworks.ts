// Provider-supplied results published by the Fireworks Specialized Intelligence Index.
// Preserve named metric units. Total tokens are not per-task usage.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
type Metric = { value: number | null; unit: string; label: string };
type Run = { model: string; metrics: Record<string, Metric>; raw?: { reasoning?: string } };
const FEED='https://fireworks.ai/specialized-intelligence-index/api/index.json';
export function fireworksBoard(benchmark:string,slug:string):Leaderboard {
 return {benchmark,url:`https://fireworks.ai/specialized-intelligence-index/benchmarks/${slug}`,feed:FEED,
  terms:'Fireworks terms restrict automated extraction; the almanac credits Fireworks AI and the named benchmark contributor and links the source.',
  chart:{title:'Score vs. cost per task',x:{key:'cost',label:'Cost per task',unit:'$',better:'lower'},y:{key:'score',label:'Score',unit:'%',better:'higher'}},
  async fetch():Promise<LeaderboardRow[]> {
   const data=await fetchJson<{benchmarks:{id:string;last_updated:string;headline_metric:{unit:string};results:Run[]}[]}>(FEED);
   const source=data.benchmarks.find(b=>b.id===slug);
   if(!source||source.headline_metric.unit!=='percent')throw new Error('Fireworks benchmark or unit changed');
   const rows=source.results.map(r=>{
    const score=r.metrics.score?.value;if(typeof score!=='number')throw new Error('Fireworks score missing');
    const cost=r.metrics.cost_per_task??r.metrics.cost_per_deck;
    const output=Object.values(r.metrics).find(m=>m.unit==='tokens'&&/^Output tokens \/ task$/i.test(m.label));
    const metrics=Object.fromEntries(Object.entries(r.metrics).filter(([k,v])=>k!=='score'&&typeof v.value==='number').map(([k,v])=>[k,v.value as number]));
    return {model:r.model,score,setting:r.raw?.reasoning,date:source.last_updated,cost:cost?.unit==='USD'?cost.value??undefined:undefined,tokens:output?.value??undefined,metrics};
   });
   if(!rows.length)throw new Error('Fireworks result rows missing');return rows;
  }
 };
}
