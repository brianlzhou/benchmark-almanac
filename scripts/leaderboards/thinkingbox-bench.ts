// Published whole-benchmark headline, with settings kept separate.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2608.19741';
const board:Leaderboard={benchmark:'thinkingbox-bench',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[1]==='pass@1 (%)' && t[0]?.[3]==='pass@20 (%)');if(!t)throw new Error('Reviewed results missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1)){out.push({model:c[0],score:parseFloat(c[1]),harness:'Thinkingbox',setting:'507 tasks; 20 trials',metrics:{passAll20:parseFloat(c[2]),passAt20:parseFloat(c[3])}});}return checked(out,3);
 }};export default board;
