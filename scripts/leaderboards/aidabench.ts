// Overall pass@1, with model size, active parameters and both pass rates by task.
// The paper groups overall and task-level results under pass@3 and pass@1.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = "https://arxiv.org/html/2603.15636";
const board: Leaderboard = {benchmark:"aidabench", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
parts: {
  qa: { name: 'QA', group: 'Task type' },
  visualization: { name: 'Visualization', group: 'Task type' },
  fileGeneration: { name: 'File generation', group: 'Task type' },
},
 stats: {
  passAt3: { name: 'Overall pass@3', unit: '%', better: 'higher' },
  qaPass3: { name: 'QA pass@3', unit: '%', better: 'higher' },
  visualizationPass3: { name: 'Visualization pass@3', unit: '%', better: 'higher' },
  fileGenerationPass3: { name: 'File generation pass@3', unit: '%', better: 'higher' },
  activeParamsB: { name: 'Active parameters', unit: 'billions' },
 },
 async fetch() {
  const table=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0]) === "[\"\",\"\",\"pass@3\",\"pass@3\",\"pass@3\",\"pass@3\",\"pass@1\",\"pass@1\",\"pass@1\",\"pass@1\"]" && JSON.stringify(t[1]) === "[\"Model\",\"Model Size\",\"Overall\",\"QA\",\"Data Vis.\",\"File Gen.\",\"Overall\",\"QA\",\"Data Vis.\",\"File Gen.\"]");
  if(!table)throw new Error('Reviewed overall table missing');
  const out:LeaderboardRow[]=[];
  for(const c of table.slice(1)) {
   if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(c[6]?.trim()??''))continue;
   const metrics:Record<string,number>={};
   for(const [i,key] of [[2, "passAt3"], [3, "qaPass3"], [4, "visualizationPass3"], [5, "fileGenerationPass3"], [7, "qa"], [8, "visualization"], [9, "fileGeneration"]] as [number,string][]){const v=Number(c[i]?.replace('%',''));if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
   const size = c[1].match(/^([\d.]+)([BT])\b/i);
   const active = c[1].match(/([\d.]+)B\s+active/i);
   if (active) metrics.activeParamsB = Number(active[1]);
   const params = size ? Number(size[1]) * (size[2].toUpperCase() === 'T' ? 1000 : 1) : undefined;
   out.push({params,model:c[0].replace(/\s*\[[^\]]+\]/g,''),score:Number(c[6].replace('%','')),metrics});
  }
  return checked(out,3);
 }
};
export default board;
