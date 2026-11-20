// ConceptEdit-Bench overall score from the model-comparison table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = "https://arxiv.org/html/2608.16812";
const board: Leaderboard = {benchmark:"conceptedit-bench",url:URL,feed:URL,terms:PAPER_TERMS,
parts: {
  advanced: { name: 'Advanced', group: 'Category' },
  object: { name: 'Object', group: 'Category' },
  composition: { name: 'Composition', group: 'Category' },
  global: { name: 'Global', group: 'Category' },
  portrait: { name: 'Portrait', group: 'Category' },
  text: { name: 'Text', group: 'Category' },
},
 async fetch() {
  const table=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0]) === "[\"Model\",\"Advanced\",\"Object\",\"Compo.\",\"Global\",\"Portrait\",\"Text\",\"Overall\"]");
  if(!table)throw new Error('Reviewed overall table missing');
  const out:LeaderboardRow[]=[];
  for(const c of table.slice(1)) {
   if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(c[7]?.trim()??''))continue;
   const metrics:Record<string,number>={};
   for(const [i,key] of [[1, "advanced"], [2, "object"], [3, "composition"], [4, "global"], [5, "portrait"], [6, "text"]] as [number,string][]){const v=Number(c[i]?.replace('%',''));if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
   out.push({model:c[0].replace(/\s*\[[^\]]+\]/g,''),score:Number(c[7].replace('%','')),metrics});
  }
  return checked(out,3);
 }
};
export default board;
