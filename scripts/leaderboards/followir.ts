// FollowIR tests changes to document rankings after an instruction changes. The authors' Table 2
// reports "Average p-MRR" across Robust04, News21 and Core17. Average the three MTEB scores
// on their original -1 to 1 scale, retaining each task and the leaderboard's model metadata.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const tasks=['Robust04','News21','Core17'];
const urlFor=(name:string)=>'https://mteb-leaderboard-backend.hf.space/v1/tasks/'+name+'InstructionRetrieval/scores';
const board:Leaderboard={
  benchmark:'followir',url:'https://huggingface.co/spaces/mteb/leaderboard?task=instructionretrieval',
  feed:urlFor(tasks[0]),host:'MTEB',terms:'MTEB releases its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  headline:'Mean pairwise mean reciprocal rank across Robust04, News21 and Core17, on the MTEB scale from -1 to 1.',
  parts:Object.fromEntries(tasks.map(t=>[t,t+' p-MRR'])),
  async fetch(){
    const models=new Map<string,LeaderboardRow>();
    for(const [i,task] of tasks.entries()){
      if(i) await new Promise(resolve=>setTimeout(resolve,1050));
      const results=await taskScores(urlFor(task),task+'InstructionRetrieval','p-MRR',212);
      for(const result of results){
        const row=models.get(result.model)??{...result,metrics:{...result.metrics}};
        if(task in row.metrics!) throw new Error('Duplicate '+task+' result for '+row.model);
        row.metrics![task]=result.score;
        models.set(row.model,row);
      }
    }
    const rows=[...models.values()].filter(row=>tasks.every(t=>Number.isFinite(row.metrics![t])));
    for(const row of rows) row.score=tasks.reduce((s,t)=>s+row.metrics![t],0)/tasks.length;
    return checked(rows,212);
  },
};
export default board;
