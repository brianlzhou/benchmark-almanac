// Public per-configuration run.json objects power the official table. Incomplete scenarios count as zero.
// Cost is the source's list-price estimate per rollout. tokensOut is the average output-token count.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';
const BASE='https://cribl.io/leaderboard-s3',PREFIX='secIT-1.0';
const board:Leaderboard={benchmark:'secit-bench',url:'https://cribl.io/ai-research-lab/secitbench/',feed:BASE+'/'+PREFIX+'/runs/*/run.json',
 terms:'Cribl website terms prohibit automated extraction; the Almanac credits Cribl and links the original source.',
 chart:{title:'Accuracy vs. cost',x:{key:'cost',label:'Estimated cost per rollout',unit:'$',better:'lower'},y:{key:'score',label:'Accuracy',unit:'%',better:'higher'}},
 async fetch(){
  const catalog=await fetchJson<{models:Record<string,{displayName:string}>}>(BASE+'/'+PREFIX+'/models.json');
  const keys:string[]=[];let cursor:string|undefined;
  do{await new Promise(r=>setTimeout(r,1050));const params=new URLSearchParams({'list-type':'2',prefix:PREFIX+'/runs/'});if(cursor)params.set('continuation-token',cursor);
   const xml=await fetchText(BASE+'/?'+params);keys.push(...[...xml.matchAll(/<Key>([^<]+\/run\.json)<\/Key>/g)].map(m=>text(m[1])));
   cursor=xml.includes('<IsTruncated>true</IsTruncated>')?text(xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1]||''):undefined;
   if(xml.includes('<IsTruncated>true</IsTruncated>')&&!cursor)throw new Error('SecIT listing cursor missing');
  }while(cursor);
  const rows:LeaderboardRow[]=[];
  for(const key of keys){await new Promise(r=>setTimeout(r,1050));const run=await fetchJson<any>(BASE+'/'+key);
   for(const r of run.rows){if(!Number.isFinite(r.accuracy))continue;
    const setting=run.id.split('__').slice(2).join(' / ');
    rows.push({model:catalog.models[r.model]?.displayName||r.model,harness:r.harnessType,setting:setting||undefined,score:r.accuracy,cost:r.cost,tokens:r.tokensOut,date:run.publishedAt?.slice(0,10),metrics:{sem:r.sem,inputTokens:r.tokensIn,latency:r.timeMin*60,scenarios:r.nScenarios}});
   }
  }
  if(!rows.length)throw new Error('No SecIT published runs');return rows;
 }};
export default board;
