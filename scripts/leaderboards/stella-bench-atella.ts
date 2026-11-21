// Atella ranks comparable STELLA runs by the percentage of conversations with harmful responses. The JSON also gives unhelpfulness and the conversation count.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://leaderboard.atella.ai/data.json";
interface Run {name:string;ranked:boolean;harmful_pct:number;unhelpful_pct:number;n:number;date:string}

const board: Leaderboard = {
  benchmark: "stella-bench-atella",
  url: "https://leaderboard.atella.ai/",
  feed,
  terms: "The leaderboard gives no reuse license. The site returns 404 for robots.txt.",
  stats: { unhelpfulPct: { name: 'Unhelpful response rate', unit: '%', better: 'lower' }, conversations: { name: 'Conversations', unit: 'count' } },
  async fetch(){
    const d=await fetchJson<{models:Run[]}>(feed);const runs=d.models.filter(r=>r.ranked);
    if(runs.length<12) throw new Error('Missing current STELLA runs');
    return runs.map(r=>{
      if(!r.name || ![r.harmful_pct,r.unhelpful_pct,r.n].every(Number.isFinite)) throw new Error('Incomplete STELLA run');
      return {model:r.name,score:r.harmful_pct,date:r.date,metrics:{unhelpfulPct:r.unhelpful_pct,conversations:r.n}};
    });
  },
};
export default board;
