// MultiRC on SuperGLUE: F1a as the headline percentage and exact match as a separate metric. Select
// only public, admin-approved SuperGLUE 2.0 submissions and the best overall submission per uploader,
// as the official board does. Exclude human and non-model references, and pace Firebase requests.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { SUPERGLUE_ALIASES, SUPERGLUE_TERMS } from './superglue.ts';
const DB='https://mtl-sentence-representations.firebaseio.com/superglue/';
const board:Leaderboard={
 benchmark:'multirc',url:'https://super.gluebenchmark.com/leaderboard',feed:DB+'resultsVisibility.json',terms:SUPERGLUE_TERMS,aliases:SUPERGLUE_ALIASES,
 async fetch(){
  let first=true;
  const get=async<T>(path:string):Promise<T>=>{if(!first)await new Promise(r=>setTimeout(r,1100));first=false;return fetchJson<T>(DB+path+'.json');};
  const vis=await get<Record<string,{adminApproved?:boolean;public?:boolean}>>('resultsVisibility');
  const tasks=await get<Record<string,{identifier:string}>>('tasks');
  const taskId=Object.entries(tasks).find(([,t])=>t.identifier==='MultiRC')?.[0];if(!taskId)throw new Error('MultiRC task missing');
  type Result={superglueVersion?:number;macroScore?:number;uploaderUid:string;createdOn:number;editable?:{name?:string};tasks?:Record<string,{score?:number;accuracy?:number}>};
  const best=new Map<string,Result>();
  for(const [id,v] of Object.entries(vis)){if(!v.adminApproved||!v.public)continue;const r=await get<Result|null>('results/'+id);if(!r||(r.superglueVersion??1.9).toFixed(1)!=='2.0'||typeof r.macroScore!=='number')continue;const old=best.get(r.uploaderUid);if(!old||r.macroScore>old.macroScore!)best.set(r.uploaderUid,r);}
  const rows:LeaderboardRow[]=[];
  for(const r of best.values()){const model=r.editable?.name?.trim(),v=r.tasks?.[taskId];if(!model||/human|most frequent|CBoW/i.test(model)||typeof v?.score!=='number')continue;rows.push({model,score:v.score*100,setting:'F1a',date:new Date(r.createdOn).toISOString().slice(0,10),...(typeof v.accuracy==='number'?{metrics:{exactMatch:v.accuracy*100}}:{})});}
  if(!rows.length)throw new Error('No MultiRC results');return rows;
 }
};
export default board;
