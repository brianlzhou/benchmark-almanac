// SynthBench compares simulated and human survey responses. Its public index feed reports the score and interval for each system and its available surveys.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.synthbench.org/data/sb-index.json";
const board: Leaderboard = {
  benchmark: "synthbench-survey",
  stats: {
    coverage: { name: 'Coverage', unit: '%', better: 'higher' }, runs: { name: 'Runs', unit: 'count' }, latencyP50: { name: 'Median latency', unit: 'ms', better: 'lower' },
  },
  url: "https://www.synthbench.org/leaderboard/",
  feed,
  terms: "The project publishes aggregate scores. Each survey has separate terms for question data. The host permits the public index and excludes separate detail paths in robots.txt.",
  parts: {
    opinionsqa: 'OpinionsQA', opinionsqa_politics: { name: 'Politics', group: 'OpinionsQA' }, opinionsqa_economy: { name: 'Economy', group: 'OpinionsQA' }, opinionsqa_technology: { name: 'Technology', group: 'OpinionsQA' }, 'opinionsqa_science-health': { name: 'Science and health', group: 'OpinionsQA' }, opinionsqa_identity: { name: 'Identity', group: 'OpinionsQA' }, opinionsqa_society: { name: 'Society', group: 'OpinionsQA' },
    globalopinionqa: 'GlobalOpinionQA', globalopinionqa_politics: { name: 'Politics', group: 'GlobalOpinionQA' }, globalopinionqa_economy: { name: 'Economy', group: 'GlobalOpinionQA' }, globalopinionqa_technology: { name: 'Technology', group: 'GlobalOpinionQA' }, 'globalopinionqa_science-health': { name: 'Science and health', group: 'GlobalOpinionQA' }, globalopinionqa_identity: { name: 'Identity', group: 'GlobalOpinionQA' }, globalopinionqa_society: { name: 'Society', group: 'GlobalOpinionQA' }, globalopinionqa_global: { name: 'Global', group: 'GlobalOpinionQA' },
    gss: 'GSS', gss_politics: { name: 'Politics', group: 'GSS' }, gss_economy: { name: 'Economy', group: 'GSS' }, gss_technology: { name: 'Technology', group: 'GSS' }, 'gss_science-health': { name: 'Science and health', group: 'GSS' }, gss_identity: { name: 'Identity', group: 'GSS' }, gss_society: { name: 'Society', group: 'GSS' }, gss_global: { name: 'Global', group: 'GSS' },
    subpop: 'SubPOP', subpop_politics: { name: 'Politics', group: 'SubPOP' }, subpop_economy: { name: 'Economy', group: 'SubPOP' }, subpop_technology: { name: 'Technology', group: 'SubPOP' }, 'subpop_science-health': { name: 'Science and health', group: 'SubPOP' }, subpop_identity: { name: 'Identity', group: 'SubPOP' }, subpop_society: { name: 'Society', group: 'SubPOP' }, subpop_global: { name: 'Global', group: 'SubPOP' },
  },
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
        metrics[key] = v.idx;
        metrics[key+'_lo'] = v.lo;
        metrics[key+'_hi'] = v.hi;
        for (const [topic,value] of Object.entries(v.topicIdx ?? {})) {
          if (!Number.isFinite(value)) continue;
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
