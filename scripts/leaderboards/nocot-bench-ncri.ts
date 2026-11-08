// NoCoT-Bench NCRI 15.2 is a reasoning index, not accuracy. Read every measured score from the live CSV.
// Keep ranking flags and uncertainty, and expose filler experiments as distinct configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const FEED='https://raw.githubusercontent.com/neelnanda-io/nocot-bench/main/scores_all.csv';
const board:Leaderboard={benchmark:'nocot-bench-ncri',url:'https://github.com/neelnanda-io/nocot-bench',feed:FEED,terms:'Public NoCoT-Bench results subject to the source repository license and GitHub terms.',async fetch(){
 const csv=parseCsv(await fetchText(FEED)),header=csv[0],rows:LeaderboardRow[]=[];
 for(const cells of csv.slice(1)){
  const r=Object.fromEntries(header.map((h,i)=>[h,cells[i]??''])); const score=num(r.ncri);if(!r.model_id||score===undefined)continue;
  const metrics:Record<string,number>={ranked:r.ncri_ranked==='True'?1:0,usesFiller:r.ncri_uses_filler==='True'?1:0};
  for(const [key,col] of Object.entries({ciLow:'ncri_lo95',ciHigh:'ncri_hi95',rank:'ncri_rank'})){const n=num(r[col]);if(n!==undefined)metrics[key]=n;}
  const setting='NCRI 15.2; '+(r.ncri_uses_filler==='True'?r.ncri_filler_recipe:'no filler')+'; '+r.source;
  rows.push({model:r.model_id,score,setting,metrics});
  const filler=num(r.ncri_with_filler);
  if(filler!==undefined&&r.ncri_uses_filler!=='True'){
   const extra:Record<string,number>={};for(const col of ['ncri_filler_uplift','ncri_filler_uplift_lo95','ncri_filler_uplift_hi95']){const n=num(r[col]);if(n!==undefined)extra[col]=n;}
   rows.push({model:r.model_id,score:filler,setting:'NCRI 15.2; '+r.ncri_filler_recipe+'; '+r.source,metrics:extra});
  }
 }
 if(!rows.length)throw new Error('No NCRI scores');return rows;
}};
export default board;
