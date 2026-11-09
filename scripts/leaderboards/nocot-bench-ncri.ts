// NoCoT-Bench NCRI 15.2 is a reasoning index, not accuracy. Read every measured score from the live CSV.
// Keep ranking flags and uncertainty, and expose filler experiments as distinct configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const FEED='https://raw.githubusercontent.com/neelnanda-io/nocot-bench/main/scores_all.csv';
const board:Leaderboard={benchmark:'nocot-bench-ncri',url:'https://github.com/neelnanda-io/nocot-bench',feed:FEED,terms:'Public NoCoT-Bench results subject to the source repository license and GitHub terms.',async fetch(){
 const csv=parseCsv(await fetchText(FEED)),rows:LeaderboardRow[]=[];
 for(const r of csv){
  const score=num(r.ncri);if(!r.model_id||score===undefined)continue;
  const metrics:Record<string,number>={ranked:r.ncri_ranked==='True'?1:0,usesFiller:r.ncri_uses_filler==='True'?1:0};
  for(const [key,col] of Object.entries({ciLow:'ncri_lo95',ciHigh:'ncri_hi95',rank:'ncri_rank'})){const n=num(r[col]);if(n!==undefined)metrics[key]=n;}
  const setting='NCRI 15.2; '+(r.ncri_uses_filler==='True'?r.ncri_filler_recipe:'no filler')+'; '+r.source;
  const filler=num(r.ncri_with_filler);
  if(filler!==undefined&&r.ncri_uses_filler!=='True'){
   metrics.withFiller=filler;
   for(const [key,col] of Object.entries({fillerUplift:'ncri_filler_uplift',fillerUpliftLow:'ncri_filler_uplift_lo95',fillerUpliftHigh:'ncri_filler_uplift_hi95'})){const n=num(r[col]);if(n!==undefined)metrics[key]=n;}
  }
  rows.push({model:r.model_id,score,setting,metrics});
 }
 if(!rows.length)throw new Error('No NCRI scores');return rows;
}};
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
export default board;
