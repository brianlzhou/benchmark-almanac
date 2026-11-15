// Maker-published whole-benchmark headline. Diagnostic scores remain metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2609.34492";
const board:Leaderboard={benchmark:"powerbench",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[7]==='Overall' && t[1]?.[7]?.startsWith('Macro-JA'));if(!t)throw new Error('Reviewed result table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){if(!/^\d/.test(c[7]??''))continue;out.push({model:c[0],score:parseFloat(c[7]),setting:'50 tool calls; 300 s',metrics:{fieldAccuracy:parseFloat(c[8])}});}return checked(out,3);
 }};export default board;
