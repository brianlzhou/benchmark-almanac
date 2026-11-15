// Maker-published whole-benchmark headline. Diagnostic scores remain metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/1910.11473";
const board:Leaderboard={benchmark:"qasc",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[3]==='Retr. Corpus');if(!t)throw new Error('Reviewed result table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(4)){if(!/^\d/.test(c[7]??''))continue;out.push({model:c[1],score:Number(c[7]),setting:[c[2],c[3],c[4],c[5]].filter(Boolean).join('; '),metrics:{devAccuracy:Number(c[6])}});}return checked(out,3);
 }};export default board;
