// ALE-Bench reports AtCoder performance ratings averaged over heuristic programming problems.
// Keep each self-refinement budget on the all-problems aggregate, with the same mean task cost and output tokens
// used by the site's performance-versus-cost plots. Keep each problem rating and the judged program's peak time and memory.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='https://sakanaai.github.io/ALE-Bench-Leaderboard/data/results_summary.json';
const allTaskKeys: Record<string, string> = {
  all_input_tokens_mean: 'inputTokens',
  all_output_tokens_mean: 'outputTokens',
  all_total_tokens_mean: 'totalTokens',
  all_performance_stdev: 'std',
};

type Stat = Record<string, Record<string, number>>;
interface Problem {
  problem_id: string;
  performance: number;
  max_execution_time_ms?: number;
  max_memory_usage_kib?: number;
}
interface Entry {
  model_name: string;
  detail_path?: string;
  overall_results: Array<{
    num_self_refine: number;
    performance: Stat;
    cost: Stat;
    output_tokens: Stat;
    input_tokens: Stat;
    total_tokens: Stat;
    rank: Stat;
    results?: Problem[];
  }>;
}
const board:Leaderboard={aliases:{"claude-4-sonnet": "claude-sonnet-4", "claude-4.1-opus": "claude-opus-4-1", "claude-4.5-haiku": "claude-haiku-4-5", "claude-4.5-opus": "claude-opus-4-5", "claude-4.5-sonnet": "claude-sonnet-4-5", "claude-4.6-opus": "claude-opus-4-6", "claude-4.6-sonnet": "claude-sonnet-4-6", "claude-4.7-opus": "claude-opus-4-7", "claude-4.8-opus": "claude-opus-4-8", "beam-1.0-501b-a23b": "beam-1-0"},benchmark:'ale-bench', parts: {
  short: { name: 'Short', group: 'Category' },
  long: { name: 'Long', group: 'Category' },
},url:'https://sakanaai.github.io/ALE-Bench-Leaderboard/',feed:FEED,terms:'Public Sakana AI ALE-Bench leaderboard results, subject to the repository license and GitHub terms.',chart:{title:'Performance versus cost',x:{key:'cost',label:'Mean task cost',unit:'$',better:'lower',log:true},y:{key:'score',label:'Mean performance',unit:'rating',better:'higher'}},async fetch(){
 const rows:LeaderboardRow[]=[];
 for(const model of await fetchJson<Entry[]>(FEED))for(const r of model.overall_results)for(const split of ['all']){
  const score=r.performance?.[split]?.mean;if(typeof score!=='number')continue;
  const cost=r.cost?.[split]?.mean,tokens=r.output_tokens?.[split]?.mean;const metrics:Record<string,number>={};
  if(typeof cost==='number')metrics.cost=cost;
  for(const part of ['short','long']){const value=r.performance?.[part]?.mean;if(typeof value==='number')metrics[part]=value;}
  for(const [key,value] of Object.entries({inputTokens:r.input_tokens?.[split]?.mean,meanRank:r.rank?.[split]?.mean}))if(typeof value==='number')metrics[key]=value;
  for (const key of ['performance', 'rank', 'cost', 'input_tokens', 'output_tokens', 'total_tokens'] as const) {
    for (const [category, stats] of Object.entries(r[key] ?? {})) {
      for (const [stat, value] of Object.entries(stats)) {
        const field = [category, key, stat].join('_');
        if (typeof value === 'number') metrics[allTaskKeys[field] ?? field] = value;
      }
    }
  }
  for (const task of r.results ?? []) {
    if (task.problem_id && Number.isFinite(task.performance)) {
      metrics[task.problem_id] = task.performance;
      (board.parts ??= {})[task.problem_id] = { name: task.problem_id, group: 'Problem' };
    }
    if (typeof task.max_execution_time_ms === 'number') {
      metrics.maxProgramExecutionSeconds = Math.max(metrics.maxProgramExecutionSeconds ?? 0, task.max_execution_time_ms / 1000);
    }
    if (typeof task.max_memory_usage_kib === 'number') {
      metrics.maxProgramMemoryKiB = Math.max(metrics.maxProgramMemoryKiB ?? 0, task.max_memory_usage_kib);
    }
  }
  const effort=model.model_name.match(/-(no-thinking|low|medium|high|xhigh|max)$/)?.[1];
  rows.push({model:model.model_name.replace(/-(no-thinking|low|medium|high|xhigh|max)$/,''),score,cost,tokens,link:model.detail_path ? new URL(model.detail_path, board.url).href : undefined,setting:[`self-refine ${r.num_self_refine}`,effort].filter(Boolean).join('; '),metrics});
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
