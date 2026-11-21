// IN22-Gen tests cross-language sentence matching. MTEB reports overall bitext-mining F1 and 506 language-pair test scores.
// Convert the published fractions to percentages and include only models for which MTEB reports an overall score.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task='IN22GenBitextMining';
const feed='https://mteb-leaderboard-backend.hf.space/v1/tasks/'+task+'/scores';
interface Entry { model:{name:string,url?:string,openWeights?:boolean,license?:string,totalParamsB?:number};
  score:number|null; subsetScores:Record<string,{test?:number}>; }
const board:Leaderboard={
  benchmark:'in22-gen',host:'MTEB',feed,url:'https://leaderboard.mteb.org/tasks/'+task,
  terms:'CC0 1.0: https://huggingface.co/datasets/mteb/results',
  async fetch(){
    const data=await fetchJson<{task:{name:string,mainScore:string},subsets:string[],rows:Entry[]}>(feed);
    if(data.task.name!==task || data.task.mainScore!=='f1' || data.subsets.length!==506) throw Error('Changed IN22-Gen task or language pairs');
    board.parts=Object.fromEntries(data.subsets.map(name=>[name,name]));
    const rows=data.rows.filter(r=>r.score!==null && r.model.name!=='mteb/baseline-random-encoder').map(r=>{
      const metrics:Record<string,number>={};
      for(const pair of data.subsets){
        const value=r.subsetScores[pair]?.test;
        if(typeof value!=='number' || !Number.isFinite(value)) throw Error('Missing '+pair+' for '+r.model.name);
        metrics[pair]=value*100;
      }
      return {model:r.model.name,score:r.score!*100,metrics,open:r.model.openWeights??undefined,license:r.model.license||undefined,
        params:r.model.totalParamsB||undefined,link:r.model.url||undefined};
    });
    return checked(rows,192);
  },
};
export default board;
