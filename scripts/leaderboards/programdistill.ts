// Partial reconstruction scores, model prices and activity statistics for ProgramDistill-300.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2609.18805";
const board:Leaderboard={benchmark:"programdistill", static: 'paper', parts: {
  cumulativeBinary: { name: 'Cumulative tasks', group: 'Task type' },
  logicOnly: { name: 'Logic only', group: 'Task type' },
  logicAndUi: { name: 'Logic and UI', group: 'Task type' },
},url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const tables=paperTables(await paperHtml(URL)).map(grid);const activity=tables.find(t=>t[0]?.[7]==='Edit/write steps');const prices=tables.find(t=>t[0]?.[1]==='Input ($/1M)');const cumulative=tables.find(t=>t[0]?.join('|')==='Model|Binary score|Chain score');const t=tables.find(t=>t[0]?.[1]==='Binary score' && t[1]?.[1]==='Overall');if(!t)throw new Error('Reviewed result table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){if(!/^\d/.test(c[1]??''))continue;const extra:Record<string,number>={};const price=prices?.find(r=>r[0]===c[0]);const counts=activity?.find(r=>r[0]===c[0]);const subset=cumulative?.find(r=>r[0]===c[0]);
 if(price){extra.priceIn=Number(price[1]);extra.priceOut=Number(price[2]);}
 if(subset){extra.cumulativeBinary=Number(subset[1]);extra.cumulativeChain=Number(subset[2]);}
 if(counts) for(const [i,key] of ['steps','observationSteps','editWriteSteps'].entries()){
   extra[key+'Min']=Number(counts[1+3*i]);extra[key]=Number(counts[2+3*i]);extra[key+'Max']=Number(counts[3+3*i]);
 }
 out.push({model:c[0],score:Number(c[1]),setting:'ProgramDistill-300; partial reconstruction; high effort; 1000 steps',metrics:{...extra,logicOnlyChain:Number(c[6]),logicAndUiChain:Number(c[7]),chainScore:Number(c[5]),logicOnly:Number(c[2]),logicAndUi:Number(c[3])}});}return checked(out,3);
 }};export default board;
