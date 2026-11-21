// JobBERT tests whether a vacancy title retrieves its correct ESCO occupation.
// Table 1 reports mean reciprocal rank and recall. The headline is micro MRR over individual test titles.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2109.09605';
const cols=['Macro MRR','Micro MRR','Macro Recall@1','Micro Recall@1','Macro Recall@5','Micro Recall@5','Macro Recall@10','Micro Recall@10'];
const board:Leaderboard={
  benchmark:'jobbert-job-title-normalization',static:'paper',url:feed,feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  parts:Object.fromEntries(cols.map(k=>[k,k])),
  async fetch(){
    const t=paperTables(await paperHtml(feed)).map(grid).find(t=>t[0]?.slice(1).join('|')==='MRR|MRR|Recall@1|Recall@1|Recall@5|Recall@5|Recall@10|Recall@10' &&
      t[1]?.join('|')==='Method|Macro|Micro|Macro|Micro|Macro|Micro|Macro|Micro');
    if(!t) throw Error('Missing job title ranking table');
    return checked(t.slice(2).map(r=>{
      const model=r[0].replace(/\s*\*$/,'');
      const values=r.slice(1).map(s=>s.trim()?Number(s):NaN);
      if(values.length!==8 || !values.every(Number.isFinite)) throw Error('Invalid rank metrics for '+model);
      return {model,score:values[1],metrics:Object.fromEntries(cols.map((name,i)=>[name,values[i]]))};
    }),6);
  },
};
export default board;
