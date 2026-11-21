// RetailBench publishes final net worth for each model’s survival-first selected run. The JSON identifies the agent framework and its retail operating metrics.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://linghuazhang01.github.io/RetailBench/assets/benchmark_results.json";
interface Run {model:string;framework:string;type:string;finalNetworth:number;days:number;[key:string]:unknown}

const board: Leaderboard = {
  benchmark: "retailbench",
  url: "https://linghuazhang01.github.io/RetailBench/#leaderboard",
  feed,
  terms: "The results file gives its generation date and includes a separate scripted oracle. The authors release RetailBench under the MIT license. https://github.com/linghuazhang01/RetailBench/blob/main/LICENSE The host lists a sitemap and no crawler restrictions.",
  async fetch(){
    const d=await fetchJson<{benchmark:{llmModels:number;environment:string};leaderboard:Run[]}>(feed);
    const rows=d.leaderboard.filter(r=>r.type==='llm');
    if(rows.length<7 || rows.length!==d.benchmark.llmModels) throw new Error('Incomplete selected retail runs');
    return rows.map(r=>{
      if(!r.model || !r.framework || !Number.isFinite(r.finalNetworth)) throw new Error('Missing selected run');
      const metrics:Record<string,number>={};
      for(const [k,v] of Object.entries(r)) if(typeof v==='number' && k!=='finalNetworth') metrics[k]=v;
      return {model:r.model,harness:r.framework,setting:d.benchmark.environment,score:r.finalNetworth,metrics};
    });
  },
};
export default board;
