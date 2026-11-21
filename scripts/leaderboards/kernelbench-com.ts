// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// KernelBench.com tests agent-written GPU kernels. The author ranks each suite by valid passes divided by its problem count.
// Keep only the same model, GPU, harness and effort across Hard, CUDA and Mega. Normalized performance stays a secondary metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';
const feed='https://kernelbench.com/data/models.json';
const parts={hard:'KernelBench Hard',cuda:'KernelBench CUDA',mega:'KernelBench Mega'};
interface Run {harness:string|null;effort:string|null;passed:number;total_problems:number;perf:number|null}
interface Entry {name:string;benches:Record<string,Run & {gpus:Record<string,Run>}>}
const board:Leaderboard={
  benchmark:'kernelbench-com',url:'https://kernelbench.com/models',feed,parts,
  terms:'The author publishes the leaderboard and its methodology at https://kernelbench.com/models.',
  async fetch(){
    const data=await fetchJson<{models:Entry[],methodology:string,benches:Record<string,{gpu_labels:Record<string,string>}>}>(feed);
    if(!data.methodology.includes('valid passes')||!data.methodology.includes('problems'))throw new Error('Ranking definition changed');
    const rows:LeaderboardRow[]=[];
    for(const entry of data.models){
      const runs=new Map<string,LeaderboardRow>();
      for(const [part,deck] of Object.entries(entry.benches)){
        if(!(part in parts))throw new Error('Unexpected suite '+part);
        for(const [gpu,result] of Object.entries({rtxpro6000:deck,...deck.gpus})){
          if(!result.harness)continue;
          if(!Number.isInteger(result.passed)||!Number.isInteger(result.total_problems)||result.total_problems<=0)throw new Error('Invalid pass count');
          const hardware=data.benches[part].gpu_labels[gpu];
          if(!hardware)throw new Error('Unknown GPU');
          const context=entry.name.match(/^Kimi K3 \((256k|1M)\)$/)?.[1];
          const model=context?'Kimi K3':entry.name;
          const setting=[hardware,context,result.effort].filter(Boolean).join(', ');
          const key=JSON.stringify([setting,result.harness]);
          const row=runs.get(key)??{model,harness:result.harness,setting,score:0,metrics:{}};
          row.metrics![part]=result.passed/result.total_problems;
          row.metrics![part+'Passed']=result.passed;row.metrics![part+'Problems']=result.total_problems;
          if(typeof result.perf==='number')row.metrics![part+'Performance']=result.perf;
          runs.set(key,row);
        }
      }
      for(const row of runs.values()){
        if(!Object.keys(parts).every(k=>k in row.metrics!))continue;
        row.score=Object.keys(parts).reduce((sum,k)=>sum+row.metrics![k],0)/3;
        rows.push(row);
      }
    }
    return checked(rows,11);
  },
};
export default board;
