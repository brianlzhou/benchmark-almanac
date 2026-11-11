// Coval's public dashboard API. STT WER and TTS startup latency are separate measurements.
// Pin the explicit 24-hour pooled view. WER is already percent; TTFA is milliseconds.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
export function covalBoard(benchmark: string, type: 'STT' | 'TTS'): Leaderboard {
 const feed = `https://benchmarks-api-6wxgp27p2a-ue.a.run.app/v1/results/aggregates?benchmark=${type}&window=24h&include_series=false`;
 type Stat = {provider:string;model:string;metric_type:string;avg_value:number;p25:number;p50:number;p75:number;p90:number;p95:number;sample_count:number;insufficient_samples:boolean};
 return {benchmark,url:`https://benchmarks.coval.ai/${type.toLowerCase()}`,feed,
  terms:'Public Coval dashboard API and Apache-2.0 benchmark repository. The almanac credits Coval and links the source.',
  async fetch(): Promise<LeaderboardRow[]> {
   const d=await fetchJson<{benchmark:string;model_stats:Stat[];snapshot:{as_of:string}}>(feed);
   if(d.benchmark!==type)throw new Error('Coval benchmark changed');
   const metric=type==='STT'?'WER':'TTFA';
   const rows=d.model_stats.filter(s=>s.metric_type===metric).map(s=>({
    model:`${s.provider}/${s.model}`,score:type==='STT'?s.avg_value:s.p50,
    setting:`24h pooled; ${type==='STT'?'mean WER (%)':'median TTFA (ms)'}`,date:d.snapshot.as_of.slice(0,10),
    metrics:{mean:s.avg_value,p25:s.p25,p50:s.p50,p75:s.p75,p90:s.p90,p95:s.p95,samples:s.sample_count,
      insufficientSamples:s.insufficient_samples?1:0,
      ...Object.fromEntries(d.model_stats.filter(t=>t.provider===s.provider&&t.model===s.model&&t.metric_type!==metric).map(t=>[t.metric_type+'Mean',t.avg_value]))}
   }));
   if(!rows.length)throw new Error('Coval has no current scored rows');
   return rows;
  }};
}
