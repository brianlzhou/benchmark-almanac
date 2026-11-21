// Maker-published whole-benchmark headline. Diagnostic scores remain metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2605.22536";
const board:Leaderboard={benchmark:"spacedg-bench", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[1]==='Clean Image' && t[0]?.[0]==='Models');if(!t)throw new Error('Reviewed result table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(3)){if(!/^\d/.test(c[11]??'')||c[0]==='Human Level')continue;let model=c[0].replace(/\{\}_?\{\\textit\{([^}]+)\}\}/g,'-$1');let setting='9918 degraded instances';if(/^Non-Image\s*-/.test(model)){model=model.replace(/^Non-Image\s*-/,'');setting+='; no image';}out.push({model,score:Number(c[11]),setting,metrics:/^\d/.test(c[1])?{clean:Number(c[1])}:{}});}return checked(out,3);
 }};export default board;
