// Amazon Counterfactual Detection tests whether a review sentence describes a counterfactual.
// Read MTEB's published classification accuracy and convert fractions to percentages. Keep
// models with test results on every listed subset, and retain validation accuracy where available.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const task='AmazonCounterfactualClassification';
const feed='https://mteb-leaderboard-backend.hf.space/v1/tasks/'+task+'/scores';
const subsets={de:'German',en:'English','en-ext':'English (extended)',ja:'Japanese'};
type Entry={model:{name:string;url?:string;openWeights?:boolean;license?:string;totalParamsB?:number};score:number;
  subsetScores:Record<string,Record<string,number>>};
const board:Leaderboard={
  benchmark:'amazon-counterfactual-detection',url:'https://mteb-leaderboard.hf.space/tasks/'+task,feed,host:'MTEB',
  terms:'MTEB publishes its results under CC0 1.0 at https://huggingface.co/datasets/mteb/results.',
  parts:Object.fromEntries(Object.entries(subsets).flatMap(([k,group])=>['test','validation'].map(s=>[k+s,{name:s==='test'?'Test':'Validation',group,unit:'%'}]))),
  async fetch(){
    const data=await fetchJson<{task:{name:string;mainScore:string};subsets:string[];rows:Entry[]}>(feed);
    if(data.task.name!==task || data.task.mainScore!=='accuracy' || data.subsets.slice().sort().join()!==Object.keys(subsets).sort().join()) throw new Error('MTEB task changed');
    const rows=data.rows.filter(r=>Number.isFinite(r.score) && Object.keys(subsets).every(k=>Number.isFinite(r.subsetScores[k]?.test))).map(r=>{
      const metrics:Record<string,number>={};
      for(const [k,v] of Object.entries(r.subsetScores)) for(const [split,n] of Object.entries(v)){
        if(!Number.isFinite(n)) throw new Error('Invalid subset accuracy');
        metrics[k+split]=100*n;
      }
      return {model:r.model.name,score:100*r.score,metrics,link:r.model.url||undefined,open:r.model.openWeights??undefined,
        license:r.model.license||undefined,params:r.model.totalParamsB||undefined};
    });
    return checked(rows,194);
  },
};
export default board;
