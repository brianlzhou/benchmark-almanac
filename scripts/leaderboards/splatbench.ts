// Full 30-task, medium-effort SplatBench headline. Read the same static JSON as the official Space.
// The dataset viewer API rate-limits this dataset. Its 15-task effort and feedback experiments are separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const feed='https://huggingface.co/spaces/perpetual-research/splatbench-explorer/raw/main/media/splatbench/summary.json';
const board:Leaderboard={benchmark:'splatbench',url:'https://huggingface.co/spaces/perpetual-research/splatbench-explorer',feed,
 terms:"The dataset's episodes and analysis are CC BY 4.0 and its code is MIT. The Almanac credits and links Perpetual Research.",
 async fetch():Promise<LeaderboardRow[]>{
  const d=await fetchJson<{tasks:unknown[];models:Record<string,{label:string;mean:number;ci95:number[];usd:number;minutes:number}>}>(feed);
  if(d.tasks.length!==30)throw new Error('SplatBench headline task set changed');
  const rows=Object.values(d.models).filter(m=>Number.isFinite(m.mean)).map(m=>({model:m.label,score:m.mean,setting:'medium effort',cost:m.usd,metrics:{ciLow:m.ci95[0],ciHigh:m.ci95[1],minutes:m.minutes}}));
  if(rows.length<5)throw new Error('SplatBench headline rows missing');return rows;
 }
};export default board;
