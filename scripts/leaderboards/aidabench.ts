// Overall pass@1, with overall pass@3 and task sub-scores as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = "https://arxiv.org/html/2603.15636";
const board: Leaderboard = {benchmark:"aidabench",url:URL,feed:URL,terms:PAPER_TERMS,
parts: {
  qa: { name: 'QA', group: 'Task type' },
  visualization: { name: 'Visualization', group: 'Task type' },
  fileGeneration: { name: 'File generation', group: 'Task type' },
},
 async fetch() {
  const table=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0]) === "[\"\",\"\",\"pass@3\",\"pass@3\",\"pass@3\",\"pass@3\",\"pass@1\",\"pass@1\",\"pass@1\",\"pass@1\"]" && JSON.stringify(t[1]) === "[\"Model\",\"Model Size\",\"Overall\",\"QA\",\"Data Vis.\",\"File Gen.\",\"Overall\",\"QA\",\"Data Vis.\",\"File Gen.\"]");
  if(!table)throw new Error('Reviewed overall table missing');
  const out:LeaderboardRow[]=[];
  for(const c of table.slice(1)) {
   if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(c[6]?.trim()??''))continue;
   const metrics:Record<string,number>={};
   for(const [i,key] of [[2, "pass3"], [7, "qa"], [8, "visualization"], [9, "fileGeneration"]] as [number,string][]){const v=Number(c[i]?.replace('%',''));if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
   out.push({model:c[0].replace(/\s*\[[^\]]+\]/g,''),score:Number(c[6].replace('%','')),metrics});
  }
  return checked(out,3);
 }
};
export default board;
