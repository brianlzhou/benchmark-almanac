// First Proof Batch 3: the report's source prints average correctness across all ten problems, on a -1 to 1 scale.
// Exposition, attribution, and Total Correct remain metrics. Empty submissions count as zero.
// The report is static and will not refresh with new model releases. No new aggregate is computed.
// Catalog proposal: name average correctness as the headline score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const FEED = "https://hexagonmath.org/api/v1/works/2610.00244v1/source?path=Batch3.tex";

const board: Leaderboard = {
  benchmark: "first-proof-batch-3",
  url: "https://1stproof.org/third-batch.html",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const tex=await fetchText(FEED);
    const ts=[...tex.matchAll(/\\begin\{table\}[\s\S]*?\\end\{table\}/g)].map(m=>m[0]);
    const column=(label:string,row:string)=>{
      const t=ts.find(t=>t.includes('\\label{tab:'+label+'}'));if(!t)throw new Error('First Proof table missing');
      const line=t.split('\n').find(l=>l.startsWith(row+' &'));if(!line)throw new Error('First Proof headline missing');
      const values=line.split('&').slice(1).map(c=>num(c));if(values.length!==5||values.some(v=>v===undefined))throw new Error('First Proof columns changed');return values as number[];
    };
    const score=column('correctness','Average'),correct=column('correctness','Total Correct'),exposition=column('exposition','Average'),attribution=column('attribution','Average');
    const models=['GPT-6 Astra','Claude Opus 5.5','ProofCouncil (multiple models)','MerLean (GPT-6, variant unspecified)','Kimi K3'];
    const harness=[undefined,'Siege','ProofCouncil','MerLean','Humanize'];
    return models.map((model,i)=>({model,harness:harness[i],score:score[i],metrics:{totalCorrect:correct[i],exposition:exposition[i],attribution:attribution[i]}}));
  },
};
export default board;
