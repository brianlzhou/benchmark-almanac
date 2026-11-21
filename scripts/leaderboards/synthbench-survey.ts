// SynthBench compares simulated and human survey responses. Its public index feed reports the score and interval for each system and its available surveys.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.synthbench.org/data/sb-index.json";
const board: Leaderboard = {
  benchmark: "synthbench-survey",
  stats: {
    coverage: { name: 'Coverage', unit: '%', better: 'higher' }, runs: { name: 'Runs', unit: 'count' }, latencyP50: { name: 'Median latency', unit: 'ms', better: 'lower' },
    opinionsqa: { name: 'OpinionsQA score', unit: 'score', better: 'higher' }, opinionsqa_questions: { name: 'OpinionsQA questions', unit: 'score', better: 'higher' }, opinionsqa_politics: { name: 'OpinionsQA politics', unit: 'score', better: 'higher' }, opinionsqa_economy: { name: 'OpinionsQA economy', unit: 'score', better: 'higher' }, opinionsqa_technology: { name: 'OpinionsQA technology', unit: 'score', better: 'higher' }, 'opinionsqa_science-health': { name: 'OpinionsQA science and health', unit: 'score', better: 'higher' }, opinionsqa_identity: { name: 'OpinionsQA identity', unit: 'score', better: 'higher' }, opinionsqa_society: { name: 'OpinionsQA society', unit: 'score', better: 'higher' },
    globalopinionqa: { name: 'GlobalOpinionQA score', unit: 'score', better: 'higher' }, globalopinionqa_questions: { name: 'GlobalOpinionQA questions', unit: 'score', better: 'higher' }, globalopinionqa_politics: { name: 'GlobalOpinionQA politics', unit: 'score', better: 'higher' }, globalopinionqa_economy: { name: 'GlobalOpinionQA economy', unit: 'score', better: 'higher' }, globalopinionqa_technology: { name: 'GlobalOpinionQA technology', unit: 'score', better: 'higher' }, 'globalopinionqa_science-health': { name: 'GlobalOpinionQA science and health', unit: 'score', better: 'higher' }, globalopinionqa_identity: { name: 'GlobalOpinionQA identity', unit: 'score', better: 'higher' }, globalopinionqa_society: { name: 'GlobalOpinionQA society', unit: 'score', better: 'higher' }, globalopinionqa_global: { name: 'GlobalOpinionQA global', unit: 'score', better: 'higher' },
    gss: { name: 'General Social Survey score', unit: 'score', better: 'higher' }, gss_questions: { name: 'General Social Survey questions', unit: 'score', better: 'higher' }, gss_politics: { name: 'General Social Survey politics', unit: 'score', better: 'higher' }, gss_economy: { name: 'General Social Survey economy', unit: 'score', better: 'higher' }, gss_technology: { name: 'General Social Survey technology', unit: 'score', better: 'higher' }, 'gss_science-health': { name: 'General Social Survey science and health', unit: 'score', better: 'higher' }, gss_identity: { name: 'General Social Survey identity', unit: 'score', better: 'higher' }, gss_society: { name: 'General Social Survey society', unit: 'score', better: 'higher' }, gss_global: { name: 'General Social Survey global', unit: 'score', better: 'higher' },
    subpop: { name: 'Subpopulation score', unit: 'score', better: 'higher' }, subpop_questions: { name: 'Subpopulation questions', unit: 'score', better: 'higher' }, subpop_politics: { name: 'Subpopulation politics', unit: 'score', better: 'higher' }, subpop_economy: { name: 'Subpopulation economy', unit: 'score', better: 'higher' }, subpop_technology: { name: 'Subpopulation technology', unit: 'score', better: 'higher' }, 'subpop_science-health': { name: 'Subpopulation science and health', unit: 'score', better: 'higher' }, subpop_identity: { name: 'Subpopulation identity', unit: 'score', better: 'higher' }, subpop_society: { name: 'Subpopulation society', unit: 'score', better: 'higher' }, subpop_global: { name: 'Subpopulation global', unit: 'score', better: 'higher' },
  },
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
