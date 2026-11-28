// DevDex evaluates search systems on repository, issue or pull request, and documentation retrieval.
// The headline score is the combined recall@10 percentage, an equal-weight mean across the three tracks.
// This importer reads the public results JSON published by the benchmark repository.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/firecrawl/benchmark-devdex/main/benchmark/results/results.json';
interface Track { ['recall@10']?: number; ['recall@10_ci']?: [number, number]; MRR?: number; ['MRR@10']?: number; ['MRR@10_ci']?: [number, number]; scored?: number; dead_frac?: number }
interface System { tracks?: Record<string, Track>; combined?: Track }
interface Data { systems?: Record<string, System> }
const pct=(x:number|undefined)=>x===undefined?undefined:Math.round(x*1000)/10;
const board: Leaderboard = {
 benchmark:'firecrawl-devdex', url:'https://www.firecrawl.dev/benchmarks/devdex', feed:FEED,
 terms:'The repository is MIT licensed. Results are credited to Firecrawl with a link to the repository.',
 stats:{ repoDeadFrac:{name:'Repo dead fraction',unit:'%',better:'lower'},fixDeadFrac:{name:'Issue or pull request dead fraction',unit:'%',better:'lower'},docsDeadFrac:{name:'Docs dead fraction',unit:'%',better:'lower'} },
 parts:{ repoRecall:{name:'Repo recall@10',group:'Track recall'}, fixRecall:{name:'Issue or pull request recall@10',group:'Track recall'}, docsRecall:{name:'Docs recall@10',group:'Track recall'}, repoMrr:{name:'Repo MRR@10',group:'Track MRR'}, fixMrr:{name:'Issue or pull request MRR@10',group:'Track MRR'}, docsMrr:{name:'Docs MRR@10',group:'Track MRR'} },
 async fetch(){
  const d=await fetchJson<Data>(FEED); if(!d.systems||Object.keys(d.systems).length<9) throw new Error('DevDex: fewer than nine systems');
  const rows:LeaderboardRow[]=[];
  for(const [model,s] of Object.entries(d.systems)){
   const c=s.combined; const score=pct(c?.['recall@10']); if(score===undefined) continue;
   const metrics:Record<string,number>={};
   for(const [track,key] of [['repo','repo'],['fix','fix'],['docs','docs']] as const){const t=s.tracks?.[track]; if(!t)continue; const rr=pct(t['recall@10']);const mm=pct(t['MRR@10']); if(rr!==undefined)metrics[key+'Recall']=rr;if(mm!==undefined)metrics[key+'Mrr']=mm;if(t.dead_frac!==undefined)metrics[key+'DeadFrac']=pct(t.dead_frac)!;}
   rows.push({model,score,low:pct(c?.['recall@10_ci']?.[0]),high:pct(c?.['recall@10_ci']?.[1]),metrics});
  }
  if(rows.length<8) throw new Error(`DevDex: ${rows.length} readable systems, expected at least 8`); return rows;
 }
}; export default board;
