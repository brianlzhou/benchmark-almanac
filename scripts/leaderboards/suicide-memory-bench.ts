// Suicide Memory Bench now publishes a default Overall view: mean safety level across all four benchmarks.
// Read the source's overall mean directly on its 0-4 scale, higher is safer. Never substitute safety-response percentages.
// The four condition means remain metrics. Consumer apps and command-line harnesses remain separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';
const FEED='https://prosaicintelligence.ai/research/suicide-memory-bench';
type SourceRow={model:string;score:number};
const board:Leaderboard={
 benchmark:'suicide-memory-bench',url:FEED,feed:FEED,
 terms:'The authors publish these scores on their public research page. Credit Prosaic Intelligence.',
 async fetch(){
  const flight=nextFlight(await fetchText(FEED));
  const start=flight.indexOf('"rows":{"overall":');
  if(start<0)throw new Error('Overall safety means missing');
  const data=jsonAfter<Record<string,SourceRow[]>>(flight.slice(start),'"rows":');
  const rows:LeaderboardRow[]=data.overall.map(r=>{
   let model=r.model;
   const harness=model.startsWith('Claude.ai ')?'Claude.ai':model.startsWith('Claude ')?'Claude Code':model.startsWith('GPT-')?'Codex':model.startsWith('Gemini ')?'Gemini CLI':model.startsWith('Muse ')?'Muse Code':undefined;
   if(model.startsWith('Claude.ai '))model=model.replace('Claude.ai ','Claude ');
   const metrics:Record<string,number>={};
   for(const key of ['scs-single','scs-multi','suicide-single','suicide-multi']){const v=data[key]?.find(x=>x.model===r.model);if(v && Number.isFinite(v.score))metrics[key]=v.score;}
   if(!Number.isFinite(r.score)||r.score<0||r.score>4)throw new Error('Invalid safety mean');
   return {model,harness,score:r.score,metrics};
  });
  if(!rows.length)throw new Error('No overall safety means');
  return rows;
 }
};
export default board;
