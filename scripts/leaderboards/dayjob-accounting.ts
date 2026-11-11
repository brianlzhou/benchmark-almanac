// The publisher-contributed Accounting board on Fireworks. Read the rendered current cost, not stale list prices.
// The embedded source tuple preserves recorded output tokens and the original Surge API cost as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, jsLiteral } from '../lib/html.ts';
const url='https://fireworks.ai/specialized-intelligence-index/benchmarks/accounting-and-tax/dayjob-accounting';
const board:Leaderboard={benchmark:'dayjob-accounting',url,feed:`${url} (Accounting table and DAYJOB source tuples)`,
 terms:'Fireworks and Surge AI restrict automated extraction; the Almanac credits both publishers and links the original board.',
 aliases:{'Muse Wonder 1.0':'muse-wonder','Hy4 Preview':'tencent-hy4-preview'},
 chart:{title:'Accounting score versus cost',x:{key:'cost',label:'Model cost per task at board pricing',unit:'$',better:'lower'},y:{key:'score',label:'Pass@1 at 95%',unit:'%',better:'higher'}},
 async fetch():Promise<LeaderboardRow[]>{
  const s=await fetchText(url);const t=tables(s).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.some(c=>c==='Score (pass@1 at 95%)'));
  if(!t)throw new Error('DAYJOB Accounting table missing');
  const at=s.indexOf('"DAYJOB: Accounting": {');const ri=s.indexOf('rows:',at);
  if(at<0||ri<0)throw new Error('DAYJOB Accounting source rows missing');
  const raw=jsLiteral<any[]>(s,s.indexOf('[',ri));
  const published=t.slice(1).filter(r=>num(r[3])!==undefined);
  const normalize=(s:string)=>s.replace(/[()]/g,'');
  const out:LeaderboardRow[]=published.map(r=>{
   const score=num(r[3])!;
   const source=raw.find(x=>normalize(x[0])===normalize(r[1])&&x[3]===score);
   const cost=num(r[4]);const metrics:Record<string,number>={};
   if(source){Object.assign(metrics,{surgeRecordedCost:source[4],inputTokens:source[5],cachedInputTokens:source[6],reasoningTokens:source[8]});}
   if(cost!==undefined)metrics.cost=cost;
   return {model:r[1],score,setting:source?.[2]??undefined,cost,tokens:source?.[7],metrics};
  });
  // The static table omits an older model still published in the interactive board's source tuples.
  for(const r of raw){
   if(published.some(x=>normalize(x[1])===normalize(r[0])&&num(x[3])===r[3]))continue;
   out.push({model:r[0],score:r[3],setting:r[2],cost:r[4],tokens:r[7],metrics:{cost:r[4],surgeRecordedCost:r[4],inputTokens:r[5],cachedInputTokens:r[6],reasoningTokens:r[8]}});
  }
  if(!out.length)throw new Error('DAYJOB Accounting rows missing');
  return out;
 }
};
export default board;
