// ALE-Bench reports AtCoder performance ratings averaged over heuristic programming problems.
// Keep each self-refinement budget on the all-problems aggregate, with the same mean task cost and output tokens
// used by the site's performance-versus-cost plots. Scores are ratings, not ranks or percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='https://sakanaai.github.io/ALE-Bench-Leaderboard/data/results_summary.json';
type Stat=Record<string,{mean?:number;stdev?:number}>;
interface Entry{model_name:string;overall_results:Array<{num_self_refine:number;performance:Stat;cost:Stat;output_tokens:Stat;input_tokens:Stat;rank:Stat}>}
const board:Leaderboard={aliases:{"claude-4-sonnet": "claude-sonnet-4", "claude-4.1-opus": "claude-opus-4-1", "claude-4.5-haiku": "claude-haiku-4-5", "claude-4.5-opus": "claude-opus-4-5", "claude-4.5-sonnet": "claude-sonnet-4-5", "claude-4.6-opus": "claude-opus-4-6", "claude-4.6-sonnet": "claude-sonnet-4-6", "claude-4.7-opus": "claude-opus-4-7", "claude-4.8-opus": "claude-opus-4-8", "beam-1.0-501b-a23b": "beam-1-0"},benchmark:'ale-bench',url:'https://sakanaai.github.io/ALE-Bench-Leaderboard/',feed:FEED,terms:'Public Sakana AI ALE-Bench leaderboard results, subject to the repository license and GitHub terms.',chart:{title:'Performance versus cost',x:{key:'cost',label:'Mean task cost',unit:'$',better:'lower',log:true},y:{key:'score',label:'Mean performance',unit:'rating',better:'higher'}},async fetch(){
 const rows:LeaderboardRow[]=[];
 for(const model of await fetchJson<Entry[]>(FEED))for(const r of model.overall_results)for(const split of ['all']){
  const score=r.performance?.[split]?.mean;if(typeof score!=='number')continue;
  const cost=r.cost?.[split]?.mean,tokens=r.output_tokens?.[split]?.mean;const metrics:Record<string,number>={};
  if(typeof cost==='number')metrics.cost=cost;
  for(const part of ['short','long']){const value=r.performance?.[part]?.mean;if(typeof value==='number')metrics[part]=value;}
  for(const [key,value] of Object.entries({inputTokens:r.input_tokens?.[split]?.mean,performanceStdev:r.performance?.[split]?.stdev,meanRank:r.rank?.[split]?.mean}))if(typeof value==='number')metrics[key]=value;
  const effort=model.model_name.match(/-(no-thinking|low|medium|high|xhigh|max)$/)?.[1];
  rows.push({model:model.model_name.replace(/-(no-thinking|low|medium|high|xhigh|max)$/,''),score,cost,tokens,setting:[`self-refine ${r.num_self_refine}`,effort].filter(Boolean).join('; '),metrics});
 }
 if(!rows.length)throw new Error('No ALE-Bench performance ratings');return rows;
}};
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
export default board;
