// MMEB v2 ranks multimodal embedding models by Overall accuracy (percent) across image, video and visual
// document tasks. Retain every published model, including models absent from the Almanac registry.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { text, num } from '../lib/html.ts';
const FEED='https://huggingface.co/spaces/TIGER-Lab/MMEB-Leaderboard/resolve/main/rankings/mmeb_ranking.csv';
const board:Leaderboard={benchmark:'mmeb-v2',url:'https://huggingface.co/spaces/TIGER-Lab/MMEB-Leaderboard',feed:FEED,terms:'Public TIGER-Lab MMEB leaderboard CSV, subject to the source repository license and Hugging Face terms.',async fetch(){
 const rows:LeaderboardRow[]=[];for(const r of parseCsv(await fetchText(FEED))){const score=num(r.Overall);if(score===undefined)continue;const metrics:Record<string,number>={};for(const k of ['Image-Overall','Video-Overall','Visdoc-Overall','Model Size(B)']){const n=num(r[k]);if(n!==undefined)metrics[k]=n;}
 rows.push({model:text(r.Models),score,date:/^\d{4}-\d\d-\d\d$/.test(r.Date)?r.Date:undefined,metrics});}
 if(!rows.length)throw new Error('No MMEB v2 scores');return rows;
}};
export default board;
