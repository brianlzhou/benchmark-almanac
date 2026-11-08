// ALE-Bench reports AtCoder performance ratings averaged over heuristic programming problems.
// Keep each self-refinement budget and short/long/all split, with the same mean task cost and output tokens
// used by the site's performance-versus-cost plots. Scores are ratings, not ranks or percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='https://sakanaai.github.io/ALE-Bench-Leaderboard/data/results_summary.json';
type Stat=Record<string,{mean?:number;stdev?:number}>;
interface Entry{model_name:string;overall_results:Array<{num_self_refine:number;performance:Stat;cost:Stat;output_tokens:Stat;input_tokens:Stat;rank:Stat}>}
const board:Leaderboard={benchmark:'ale-bench',url:'https://sakanaai.github.io/ALE-Bench-Leaderboard/',feed:FEED,terms:'Public Sakana AI ALE-Bench leaderboard results, subject to the repository license and GitHub terms.',chart:{title:'Performance versus cost',x:{key:'cost',label:'Mean task cost',unit:'$',better:'lower',log:true},y:{key:'score',label:'Mean performance',unit:'rating',better:'higher'}},async fetch(){
 const rows:LeaderboardRow[]=[];
 for(const model of await fetchJson<Entry[]>(FEED))for(const r of model.overall_results)for(const split of ['all','short','long']){
  const score=r.performance?.[split]?.mean;if(typeof score!=='number')continue;
  const cost=r.cost?.[split]?.mean,tokens=r.output_tokens?.[split]?.mean;const metrics:Record<string,number>={};
  if(typeof cost==='number')metrics.cost=cost;
  for(const [key,value] of Object.entries({inputTokens:r.input_tokens?.[split]?.mean,performanceStdev:r.performance?.[split]?.stdev,meanRank:r.rank?.[split]?.mean}))if(typeof value==='number')metrics[key]=value;
  const effort=model.model_name.match(/-(no-thinking|low|medium|high|xhigh|max)$/)?.[1];
  rows.push({model:model.model_name.replace(/-(no-thinking|low|medium|high|xhigh|max)$/,''),score,cost,tokens,setting:[split,`self-refine ${r.num_self_refine}`,effort].filter(Boolean).join('; '),metrics});
 }
 if(!rows.length)throw new Error('No ALE-Bench performance ratings');return rows;
}};
export default board;
