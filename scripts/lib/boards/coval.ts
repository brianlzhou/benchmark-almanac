// Coval's public dashboard API. STT WER and TTS startup latency are separate measurements.
// Pin the explicit 24-hour pooled view. WER is already percent; TTFA is milliseconds.
import type { BoardStat, Leaderboard, LeaderboardRow} from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
export function covalBoard(benchmark: string, type: 'STT' | 'TTS'): Leaderboard {
 const feed = `https://benchmarks-api-6wxgp27p2a-ue.a.run.app/v1/results/aggregates?benchmark=${type}&window=24h&include_series=false`;
 type Stat = {provider:string;model:string;metric_type:string;avg_value:number;stddev_value?:number|null;min_value?:number|null;max_value?:number|null;p25:number;p50:number;p75:number;p90:number;p95:number;sample_count:number;insufficient_samples:boolean;wer_insertions_pct?:number|null;wer_deletions_pct?:number|null;wer_substitutions_pct?:number|null};
 const stats: Record<string, BoardStat> = type === 'STT' ? {
  mean: { name: 'Mean word error rate', unit: '%', better: 'lower' as const },
  min: { name: 'Minimum word error rate', unit: '%', better: 'lower' as const },
  max: { name: 'Maximum word error rate', unit: '%', better: 'lower' as const },
  p25: { name: '25th percentile word error rate', unit: '%', better: 'lower' as const },
  p50: { name: '50th percentile word error rate', unit: '%', better: 'lower' as const },
  p75: { name: '75th percentile word error rate', unit: '%', better: 'lower' as const },
  p90: { name: '90th percentile word error rate', unit: '%', better: 'lower' as const },
  p95: { name: '95th percentile word error rate', unit: '%', better: 'lower' as const },
  werInsertions: { name: 'WER insertions', unit: '%', better: 'lower' as const },
  werDeletions: { name: 'WER deletions', unit: '%', better: 'lower' as const },
  werSubstitutions: { name: 'WER substitutions', unit: '%', better: 'lower' as const },
  samples: { name: 'Samples', unit: 'count' },
  insufficientSamples: { name: 'Insufficient samples flag', unit: 'count', note: 'Whether Coval flags the aggregate as having insufficient samples.' },
  AudioToFinalMean: { name: 'Mean time to final segment', unit: 'seconds', better: 'lower' as const },
  RTFMean: { name: 'Mean real-time factor', unit: 'score', better: 'lower' as const, note: 'Ratio of processing time to audio duration.' },
  TTFSMean: { name: 'Mean time to first segment', unit: 'seconds', better: 'lower' as const },
  TTFTMean: { name: 'Mean time to first token', unit: 'seconds', better: 'lower' as const },
 } : {
  mean: { name: 'Mean time to first audio', unit: 'ms', better: 'lower' as const },
  min: { name: 'Minimum time to first audio', unit: 'ms', better: 'lower' as const },
  max: { name: 'Maximum time to first audio', unit: 'ms', better: 'lower' as const },
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
  werInsertions: { name: 'WER insertions', unit: '%', better: 'lower' as const },
  werDeletions: { name: 'WER deletions', unit: '%', better: 'lower' as const },
  werSubstitutions: { name: 'WER substitutions', unit: '%', better: 'lower' as const },
 };
 const chart = type === 'STT'
  ? { title: 'Word error rate vs. time to final segment', x: { key: 'AudioToFinalMean', label: 'Mean time to final segment', unit: 's', better: 'lower' as const }, y: { key: 'score', label: 'Mean word error rate', unit: '%', better: 'lower' as const } }
  : { title: 'Time to first audio vs. word error rate', x: { key: 'score', label: 'Median time to first audio', unit: 'ms', better: 'lower' as const }, y: { key: 'WERMean', label: 'Mean word error rate', unit: '%', better: 'lower' as const } };
 return {benchmark,url:`https://benchmarks.coval.ai/${type.toLowerCase()}`,feed,
  terms:'Public Coval dashboard API and Apache-2.0 benchmark repository. The almanac credits Coval and links the source.',
  stats, chart,
  async fetch(): Promise<LeaderboardRow[]> {
   const d=await fetchJson<{benchmark:string;model_stats:Stat[];snapshot:{as_of:string}}>(feed);
   if(d.benchmark!==type)throw new Error('Coval benchmark changed');
   const metric=type==='STT'?'WER':'TTFA';
   const rows=d.model_stats.filter(s=>s.metric_type===metric).map(s=>{
    const others=d.model_stats.filter(t=>t.provider===s.provider&&t.model===s.model&&t.metric_type!==metric);
    const wer=type==='STT'?s:others.find(t=>t.metric_type==='WER');
    const metrics:Record<string,number>={mean:s.avg_value,p25:s.p25,p50:s.p50,p75:s.p75,p90:s.p90,p95:s.p95,samples:s.sample_count,
      insufficientSamples:s.insufficient_samples?1:0,
      ...(typeof s.stddev_value==='number'?{std:s.stddev_value}:{}),
      ...(typeof s.min_value==='number'?{min:s.min_value}:{}),
      ...(typeof s.max_value==='number'?{max:s.max_value}:{}),
      ...(typeof wer?.wer_insertions_pct==='number'?{werInsertions:wer.wer_insertions_pct}:{}),
      ...(typeof wer?.wer_deletions_pct==='number'?{werDeletions:wer.wer_deletions_pct}:{}),
      ...(typeof wer?.wer_substitutions_pct==='number'?{werSubstitutions:wer.wer_substitutions_pct}:{}),
      ...Object.fromEntries(others.map(t=>[t.metric_type+'Mean',t.avg_value]))};
    return {model:`${s.provider}/${s.model}`,score:type==='STT'?s.avg_value:s.p50,
     setting:`24h pooled; ${type==='STT'?'mean WER (%)':'median TTFA (ms)'}`,date:d.snapshot.as_of.slice(0,10),metrics};
   });
   if(!rows.length)throw new Error('Coval has no current scored rows');
   return rows;
  }};
}
