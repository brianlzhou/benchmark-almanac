// Maker-published paper results. Keep diagnostic scores in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2403.03218';
export default {
 benchmark:'wmdp-chemistry',url:'https://arxiv.org/abs/2403.03218',feed,terms:PAPER_TERMS,
 async fetch():Promise<LeaderboardRow[]> {
  const ts=flatPaperTables(await paperHtml(feed)).map(grid);
  const t=ts.find(t=>t[1]?.[4]==='Chem');
  if(!t)throw new Error('WMDP chemistry table missing');
  return checked(t.slice(2).flatMap(r=>{
   const score=num(r[4]);if(score===undefined)return [];
   // Unlearned weights are distinct models, not a different prompt for the original model.
   return [{model:r[1]==='Base'?r[0]:`${r[0]} (${r[1]} unlearned)`,score,setting:r[1],metrics:{biology:num(r[2])!,cyber:num(r[3])!,mmlu:num(r[9])!,mtBench:num(r[10])!}}];
  }),3);
 },
} satisfies Leaderboard;
