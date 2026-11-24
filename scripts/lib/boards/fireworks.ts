// Provider-supplied results published by the Fireworks Specialized Intelligence Index.
// Preserve named metric units. Total tokens are not per-task usage.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
type Metric = { value: number | null; unit: string; label: string };
type Run = { model: string; metrics: Record<string, Metric>; confidence_interval_95?: string | null; per_run_scores?: number[] | null; raw?: { reasoning?: string; harness?: string; ciHalf?: number; ci?: { lo?: number; hi?: number; runs?: number } } };
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
    if (typeof r.metrics.se?.value === 'number') metrics.stderr = r.metrics.se.value;
    let low:number|undefined,high:number|undefined;
    if (typeof r.raw?.ci?.lo === 'number' && typeof r.raw?.ci?.hi === 'number') { low = r.raw.ci.lo; high = r.raw.ci.hi; }
    else if (typeof r.raw?.ciHalf === 'number' && Number.isFinite(r.raw.ciHalf) && r.raw.ciHalf >= 0) { low = Math.round((score - r.raw.ciHalf) * 100) / 100; high = Math.round((score + r.raw.ciHalf) * 100) / 100; }
    else if (typeof r.confidence_interval_95 === 'string') { const m = r.confidence_interval_95.match(/(-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)/); if (m) { low = Number(m[1]); high = Number(m[2]); } }
    const trials = r.per_run_scores?.length || (typeof r.metrics.k?.value === 'number' && r.metrics.k.value > 0 ? r.metrics.k.value : undefined);
    const harness = typeof r.raw?.harness === 'string' && r.raw.harness.trim() ? r.raw.harness.trim() : undefined;
    return {model:r.model,score,setting:r.raw?.reasoning,harness,date:source.last_updated,cost:cost?.unit==='USD'?cost.value??undefined:undefined,tokens:output?.value??undefined,trials,low,high,metrics};
   });
   if(!rows.length)throw new Error('Fireworks result rows missing');return rows;
  }
 };
}
