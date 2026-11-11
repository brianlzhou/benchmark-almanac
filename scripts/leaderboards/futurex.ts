// Original FutureX event-score board, retained in its archived route. The current eight-week rating is separate.
// Decode its JSON literal without executing downloaded JavaScript.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
const ROOT='https://futurex.live/';
const unquote=(s:string)=>s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g,(_,e:string)=>e.length>1?String.fromCharCode(parseInt(e.slice(1),16)):({n:'\n',t:'\t',r:'\r',b:'\b',f:'\f',v:'\v',0:'\0'} as Record<string,string>)[e]??e);
const board:Leaderboard={benchmark:'futurex',url:ROOT+'futurex',feed:ROOT+' (archived FutureX route bundle)',
 terms:'Public FutureX leaderboard. Benchmark Almanac credits the authors and links the source.',
 aliases:{'GPT-o4-mini':'o4-mini'},
 async fetch(){const html=await fetchText(ROOT);
  const path=html.match(/static\/js\/async\/__subPage\/futurex\/page\.[\w]+\.js/)?.[0];
  const base=html.match(/(?:https?:)?\/\/[^"\s]+\/futurex\/static\/js\/main\.[\w]+\.js/)?.[0];
  if(!path||!base)throw new Error('FutureX route bundle missing');
  const root=new URL(base,ROOT).href.split('/static/')[0]+'/';
  const js=await fetchText(root+path);let data:any;
  for(const m of js.matchAll(/JSON\.parse\('((?:[^'\\]|\\.)*)'\)/g)){const d=JSON.parse(unquote(m[1]));if(Array.isArray(d.overall)&&d.overall[0]?.overallScore!==undefined)data=d;}
  if(!data)throw new Error('FutureX archived overall results missing');
  // The archived feed does not identify snapshots. In particular, its July/August 2025 Flash scores
  // must not resolve to the current September 2025 Flash model through a generic-name alias.
  const ambiguous=/^(?:Gemini-2\.5-(?:flash|pro)|Deepseek-R1|GPT-4o)$/i;
  return data.overall.map((r:any)=>({model:ambiguous.test(r.modelName)?r.modelName+' (snapshot unspecified)':r.modelName,setting:r.agentFramework+'; archived event scores',score:r.overallScore,
   metrics:Object.fromEntries(Object.entries(r).filter(([k,v])=>typeof v==='number'&&k!=='overallScore'))}));
 }};
export default board;
