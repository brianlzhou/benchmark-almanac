// Official resolved-rate results. Parse only numeric/string fields in the data block, never run the bundle.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
const URL='https://loopsbench.ai/';
const board:Leaderboard={benchmark:'loopsbench',url:URL,feed:URL+'assets/index-*.js (result data)',
 terms:'Public maker results; the site has no robots.txt or additional restriction on reading the published results.',
 aliases:{'DeepSeek-V4P':'deepseek-v4-pro','Kimi-2.6':'kimi-k2-6'},
 async fetch(){
  const html=await fetchText(URL);const asset=html.match(/src="([^" ]*assets\/index-[^" ]+\.js)"/);
  if(!asset)throw new Error('Results asset missing');const js=await fetchText(new globalThis.URL(asset[1],URL).href);
  const rows=[];
  for(const m of js.matchAll(/\{id:"[^"\n]+",rank:\d+,sweep:"(model|loop)",model:"([^"\n]+)",family:"([^"\n]+)",loop:"([^"\n]+)",rrBase:([\d.]+),rrLoop:([\d.]+),tprBase:([\d.]+),tprLoop:([\d.]+),depth:([\d.]+),tokens:([\d.]+)(?:,oss:!([01]))?/g)){
   rows.push({model:m[3]==='Claude'?`Claude ${m[2]}`:m[2],harness:m[4],open:m[11]===undefined?undefined:m[11]==='0',setting:'continuation loop',score:Number(m[6]),metrics:{baseResolved:Number(m[5]),baseUnitPass:Number(m[7]),unitPass:Number(m[8]),depth:Number(m[9]),tokensMillions:Number(m[10])}});
  }
  if(rows.length<3)throw new Error('Results block changed');return rows;
 }};export default board;
