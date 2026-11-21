// Coval's public dashboard API. STT WER and TTS startup latency are separate measurements.
// Pin the explicit 24-hour pooled view. WER is already percent; TTFA is milliseconds.
import type { BoardStat, Leaderboard, LeaderboardRow} from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
export function covalBoard(benchmark: string, type: 'STT' | 'TTS'): Leaderboard {
 const feed = `https://benchmarks-api-6wxgp27p2a-ue.a.run.app/v1/results/aggregates?benchmark=${type}&window=24h&include_series=false`;
 type Stat = {provider:string;model:string;metric_type:string;avg_value:number;p25:number;p50:number;p75:number;p90:number;p95:number;sample_count:number;insufficient_samples:boolean};
 const stats: Record<string, BoardStat> = type === 'STT' ? {
  mean: { name: 'Mean word error rate', unit: '%', better: 'lower' as const },
  p25: { name: '25th percentile word error rate', unit: '%', better: 'lower' as const },
  p50: { name: '50th percentile word error rate', unit: '%', better: 'lower' as const },
  p75: { name: '75th percentile word error rate', unit: '%', better: 'lower' as const },
  p90: { name: '90th percentile word error rate', unit: '%', better: 'lower' as const },
  p95: { name: '95th percentile word error rate', unit: '%', better: 'lower' as const },
  samples: { name: 'Samples', unit: 'count' },
  insufficientSamples: { name: 'Insufficient samples flag', unit: 'count', note: 'Whether Coval flags the aggregate as having insufficient samples.' },
  AudioToFinalMean: { name: 'Mean time to final segment', unit: 'seconds', better: 'lower' as const },
  RTFMean: { name: 'Mean real-time factor', unit: 'score', better: 'lower' as const, note: 'Ratio of processing time to audio duration.' },
  TTFSMean: { name: 'Mean time to first segment', unit: 'seconds', better: 'lower' as const },
  TTFTMean: { name: 'Mean time to first token', unit: 'seconds', better: 'lower' as const },
 } : {
  mean: { name: 'Mean time to first audio', unit: 'ms', better: 'lower' as const },
  p25: { name: '25th percentile time to first audio', unit: 'ms', better: 'lower' as const },
  p50: { name: '50th percentile time to first audio', unit: 'ms', better: 'lower' as const },
  p75: { name: '75th percentile time to first audio', unit: 'ms', better: 'lower' as const },
  p90: { name: '90th percentile time to first audio', unit: 'ms', better: 'lower' as const },
  p95: { name: '95th percentile time to first audio', unit: 'ms', better: 'lower' as const },
  samples: { name: 'Samples', unit: 'count' },
  insufficientSamples: { name: 'Insufficient samples flag', unit: 'count', note: 'Whether Coval flags the aggregate as having insufficient samples.' },
  TTFALeadingSilenceMean: { name: 'Mean time to first audio with leading silence', unit: 'ms', better: 'lower' as const },
  TTFARoundtripMean: { name: 'Mean round-trip time to first audio', unit: 'ms', better: 'lower' as const },
  WERMean: { name: 'Mean word error rate', unit: '%', better: 'lower' as const },
 };
 return {benchmark,url:`https://benchmarks.coval.ai/${type.toLowerCase()}`,feed,
  terms:'Public Coval dashboard API and Apache-2.0 benchmark repository. The almanac credits Coval and links the source.',
  stats,
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
