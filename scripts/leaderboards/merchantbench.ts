// MerchantBench's final net assets, in thousands of RMB, across three 365-day runs.
// Preserve ReAct and Hermes configurations; exclude the human and rule-based baselines.
// Read static object literals as JSON data, never execute the page's JavaScript.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const URL='https://air.1688.com/kapp/next1688/merchantbench/';
const board:Leaderboard={benchmark:'merchantbench',url:URL,feed:URL+' (current page bundle)',
 terms:'Public MerchantBench research leaderboard. Benchmark Almanac credits Alibaba and links the source.',
 async fetch():Promise<LeaderboardRow[]>{const html=await fetchText(URL);
  const scripts=[...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(m=>m[1]))];
  for(const url of scripts){await new Promise(r=>setTimeout(r,1100));const js=await fetchText(url);
   const matches=[...js.matchAll(/\{id:"[^"]+",label:"([^"\\]+)",framework:"([^"\\]+)",kind:"model",metrics:\{([^{}]+)\}\}/g)];
   if(!matches.length)continue;
   return matches.map(m=>{const metrics=JSON.parse('{'+m[3].replace(/([A-Za-z][\w]*):/g,'"$1":')+'}');
    if(typeof metrics.finalAssets!=='number')throw new Error('MerchantBench net-assets field missing');
    return {model:m[1],harness:m[2],score:metrics.finalAssets,metrics};
   });
  }
  throw new Error('MerchantBench model results missing');
 }};
export default board;
