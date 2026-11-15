// Maker-published whole-benchmark headline. Diagnostic scores remain metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2609.18805";
const board:Leaderboard={benchmark:"programdistill",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[1]==='Binary score' && t[1]?.[1]==='Overall');if(!t)throw new Error('Reviewed result table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){if(!/^\d/.test(c[1]??''))continue;out.push({model:c[0],score:Number(c[1]),setting:'ProgramDistill-300; partial reconstruction; high effort; 1000 steps',metrics:{chainScore:Number(c[5]),logicOnly:Number(c[2]),logicAndUi:Number(c[3])}});}return checked(out,3);
 }};export default board;
