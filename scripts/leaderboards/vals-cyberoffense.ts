// CyberOffense defines its overall score as follows:
// "Nova has 21 objectives and Lighthouse has 31, so the overall score averages the share completed on each range, and both ranges count equally."
// Compute only that publisher-defined plain mean of normalized range shares, expressed as percent.
// CATALOG PROPOSAL REQUIRED: unit must become %, and the description must identify this equal-range mean.
// Keep per-range cost and total tokens as metrics; no whole-task cost or output-token total is invented.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { sourceBoard } from '../lib/boards/vals-cyberoffense.ts';
const board:Leaderboard={benchmark:'vals-cyberoffense',url:sourceBoard.url,feed:sourceBoard.feed,terms:sourceBoard.terms,
 async fetch(){
  const groups=new Map<string,LeaderboardRow[]>();
  for(const r of await sourceBoard.fetch()){const rows=groups.get(r.model)??[];rows.push(r);groups.set(r.model,rows);}
  const result:LeaderboardRow[]=[];
  for(const [model,rows] of groups){
   const nova=rows.find(r=>r.setting?.startsWith('Nova;'));
   const lighthouse=rows.find(r=>r.setting?.startsWith('Lighthouse;'));
   if(!nova || !lighthouse)continue;
   if(rows.length!==2 || nova.metrics?.objectives!==21 || lighthouse.metrics?.objectives!==31)throw new Error('CyberOffense range definition changed');
   const metrics:Record<string,number>={novaObjectives:nova.score,lighthouseObjectives:lighthouse.score};
   for(const [prefix,r] of [['nova',nova],['lighthouse',lighthouse]] as const){
    for(const key of ['totalTokens','latency','cost','turns','toolCalls','runs','tokenBudget']){
     const v=r.metrics?.[key];if(v!==undefined)metrics[prefix+key[0].toUpperCase()+key.slice(1)]=v;
    }
   }
   result.push({model,harness:'Pi',score:100*(nova.score/21+lighthouse.score/31)/2,metrics});
  }
  if(!result.length)throw new Error('No complete CyberOffense runs');
  return result;
 }};
export default board;
