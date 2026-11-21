// SynthBench compares simulated and human survey responses. Its public index feed reports the score and interval for each system and its available surveys.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.synthbench.org/data/sb-index.json";
const board: Leaderboard = {
  benchmark: "synthbench-survey",
  url: "https://www.synthbench.org/leaderboard/",
  feed,
  terms: "The project publishes aggregate scores. Each survey has separate terms for question data. The host permits the public index and excludes separate detail paths in robots.txt.",
  parts: {},
  async fetch() {
    type Result = { base:string; name:string; members?:{id:string}[]; method:string; variant:string|null; harness:string|null;
      index:number; indexLo:number; indexHi:number; cost100:number|null; latencyP50:number|null; coverage:number; runs:number;
      ds:Record<string,{idx:number; lo:number; hi:number; n:number; topicIdx:Record<string,number>}> };
    const data = await fetchJson<{datasets:{id:string; label:string}[]; systems:Result[]}>(feed);
    const rows = data.systems.map(r => {
      if (!r.base || ![r.index,r.indexLo,r.indexHi].every(Number.isFinite) || !r.coverage) throw new Error('Incomplete SynthBench index');
      const metrics: Record<string,number> = { coverage:r.coverage, runs:r.runs };
      if (r.latencyP50 != null) metrics.latencyP50 = r.latencyP50;
      for (const [key,v] of Object.entries(r.ds)) {
        if (!Number.isFinite(v.idx)) throw new Error('Missing dataset index for ' + key);
        const label = data.datasets.find(d => d.id === key)?.label ?? key;
        board.parts![key] = label;
        metrics[key] = v.idx;
        metrics[key+'_lo'] = v.lo;
        metrics[key+'_hi'] = v.hi;
        metrics[key+'_questions'] = v.n;
        for (const [topic,value] of Object.entries(v.topicIdx ?? {})) {
          if (!Number.isFinite(value)) continue;
          board.parts![key+'_'+topic] = {name:topic,group:label};
          metrics[key+'_'+topic] = value;
        }
      }
      const blend = r.members && r.members.length > 1;
      return { model: blend ? r.name : r.base, models: blend ? r.members!.map(m => m.id) : undefined,
        setting:[r.method,r.variant].filter(Boolean).join(', '), harness:r.harness ?? undefined,
        score:r.index,low:r.indexLo,high:r.indexHi,cost:r.cost100 == null ? undefined : r.cost100/100,metrics };
    });
    if (rows.length < 48) throw new Error('Missing SynthBench configurations');
    return rows;
  },
};
export default board;
