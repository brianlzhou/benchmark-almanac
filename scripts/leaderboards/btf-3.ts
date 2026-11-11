// BTF-3's pooled Brier/RPS score covers all 2,386 questions, with numeric questions weighted threefold.
// The page's current bundle contains JSON data, decoded without executing downloaded JavaScript.
// Cost is the published mean agent LLM spend per forecast on the August cohort, not the full score cohort.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE='https://evals.futuresearch.ai/';
const unquote=(s:string)=>s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g,(_,e:string)=>e.length>1?String.fromCharCode(parseInt(e.slice(1),16)):({n:'\n',t:'\t',r:'\r',b:'\b',f:'\f',v:'\v',0:'\0'} as Record<string,string>)[e]??e);
const board:Leaderboard={benchmark:'btf-3',url:PAGE+'#btf3',feed:PAGE+' (current app/page bundle: pooled scores and forecast costs)',
 terms:'FutureSearch terms restrict automated extraction; Benchmark Almanac credits FutureSearch and links the source.',
 chart:{title:'Pooled score vs. forecast cost',note:'Score uses the full cohort. Cost is mean agent LLM spend per forecast on the August 2026 cohort.',x:{key:'cost',label:'Cost per forecast',unit:'$',better:'lower'},y:{key:'score',label:'Pooled score',better:'lower'}},
 async fetch():Promise<LeaderboardRow[]> {
  const html=await fetchText(PAGE);const src=html.match(/src="([^\"]*\/app\/page-[^\"]+\.js)"/)?.[1];if(!src)throw new Error('FutureSearch page bundle missing');
  const js=await fetchText(new URL(src,PAGE).href);const blobs=[...js.matchAll(/JSON\.parse\('((?:[^'\\]|\\.)*)'\)/g)].map(m=>JSON.parse(unquote(m[1])));
  const arrays=blobs.flatMap(d=>Object.values(d).filter(Array.isArray)) as any[][];
  const scores=arrays.find(a=>a[0]?.pooled!==undefined),costs=arrays.find(a=>a[0]?.pooledPerForecast!==undefined);
  if(!scores||!costs)throw new Error('BTF-3 score/cost data missing');
  return scores.map(r=>{const c=costs.find(c=>c.label===r.label);const m=r.label.match(/^(.*?)\s+\(([^)]+)\)$/);return {
   model:m?.[1]??r.label,setting:m?.[2],score:r.pooled,cost:c?.pooledPerForecast,
   metrics:{ciLow:r.pooledLo,ciHigh:r.pooledHi,binaryBrier:r.binaryBrier,numericRps:r.numericRps,nBinary:r.nBinary,nNumeric:r.nNumeric},
  };});
 }};
export default board;
