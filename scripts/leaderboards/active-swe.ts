// Recorded-bug Resolved percentage over the main benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = "https://arxiv.org/html/2608.04682";
const board: Leaderboard = {benchmark:"active-swe",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch() {
  const table=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0]) === "[\"Model\",\"Recorded\",\"Recorded\",\"Recorded\",\"Potential\",\"Potential\",\"Potential\"]" && JSON.stringify(t[1]) === "[\"Model\",\"LR\",\"LP\",\"Resolved\",\"Count\",\"TV\",\"Revealed\"]");
  if(!table)throw new Error('Reviewed overall table missing');
  const out:LeaderboardRow[]=[];
  for(const c of table.slice(1)) {
   if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(c[3]?.trim()??''))continue;
   const metrics:Record<string,number>={};
   for(const [i,key] of [[1, "localizationRecall"], [2, "localizationPrecision"], [4, "potentialCount"], [5, "testValidity"], [6, "revealed"]] as [number,string][]){const v=Number(c[i]?.replace('%',''));if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
   out.push({model:c[0].replace(/\s*\[[^\]]+\]/g,''),score:Number(c[3].replace('%','')),metrics});
  }
  return checked(out,3);
 }
};
export default board;
