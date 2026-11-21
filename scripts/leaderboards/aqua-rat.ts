// Original paper answer accuracy. Architecture variants retain their published names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = "https://arxiv.org/html/1705.04146";
const board: Leaderboard = {benchmark:"aqua-rat", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 stats:{perplexity:{name:'Perplexity',unit:'score',better:'lower'},bleu:{name:'BLEU',unit:'score',better:'higher'}},
 async fetch() {
  const table=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0]) === "[\"Model\",\"Perplexity\",\"BLEU\",\"Accuracy\"]");
  if(!table)throw new Error('Reviewed overall table missing');
  const out:LeaderboardRow[]=[];
  for(const c of table.slice(1)) {
   if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(c[3]?.trim()??''))continue;
   const metrics:Record<string,number>={};
   for(const [i,key] of [[1, "perplexity"], [2, "bleu"]] as [number,string][]){const v=Number(c[i]?.replace('%',''));if(c[i]?.trim()&&Number.isFinite(v))metrics[key]=v;}
   out.push({model:c[0].replace(/\s*\[[^\]]+\]/g,''),score:Number(c[3].replace('%','')),metrics});
  }
  return checked(out,3);
 }
};
export default board;
