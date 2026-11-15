// Published Overall success percentage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = "https://arxiv.org/html/2605.27995";
const board: Leaderboard = {benchmark:"asynctool",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch() {
  const table=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0]) === "[\"Models\",\"Step Level\",\"Step Level\",\"Sub-Task Level\",\"Sub-Task Level\",\"Sub-Task Level\",\"Task Level\",\"Task Level\",\"Overall\"]" && JSON.stringify(t[1]) === "[\"Models\",\"Func.\",\"Param.\",\"Char.\",\"Env.\",\"Acc.\",\"Char.\",\"Env.\",\"\"]");
  if(!table)throw new Error('Reviewed overall table missing');
  const out:LeaderboardRow[]=[];
  for(const c of table.slice(1)) {
   if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(c[8]?.trim()??''))continue;
   const metrics:Record<string,number>={};
   for(const [i,key] of [[1, "function"], [2, "parameter"], [3, "subtaskCharacter"], [4, "subtaskEnvironment"], [5, "subtaskAccuracy"], [6, "taskCharacter"], [7, "taskEnvironment"]] as [number,string][]){const v=Number(c[i]?.replace('%',''));if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
   out.push({model:c[0].replace(/\s*\[[^\]]+\]/g,''),score:Number(c[8].replace('%','')),metrics});
  }
  return checked(out,3);
 }
};
export default board;
