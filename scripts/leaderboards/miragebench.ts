// Maker's whole-benchmark aggregate. Auxiliary metrics are not separate rows.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2608.04570";
const board:Leaderboard={benchmark:'miragebench',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"Model\",\"Claims\",\"Grnd\",\"Stereo\",\"Fabric\",\"OI%\"]");if(!t)throw new Error('Reviewed table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1)){if(c[0]==='Mean')continue;out.push({model:c[0],score:Number(c[5]),metrics:{claims:Number(c[1].replace(/,/g,'')),grounded:Number(c[2]),stereotype:Number(c[3]),fabrication:Number(c[4])}});}return checked(out,3);
 }};export default board;
