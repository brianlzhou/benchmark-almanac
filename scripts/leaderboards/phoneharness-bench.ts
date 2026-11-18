// Maker-published whole-benchmark aggregate.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
import {paperTables,grid} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2606.14832";
const board:Leaderboard={benchmark:'phoneharness-bench',harnesses:'system',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[0]==='Type'&&t[0]?.[2]==='Overall');if(!t)throw new Error('Reviewed overall table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1))out.push({model:c[0]==='Harness'?c[1].replace(' (Ours)','')+' (backbone unspecified)':c[1],harness:c[0]==='Harness'?c[1].replace(' (Ours)',''):undefined,score:parseFloat(c[2]),metrics:{device:parseFloat(c[3]),singleApp:parseFloat(c[4]),toolAssisted:parseFloat(c[5]),crossApp:parseFloat(c[6])}});return checked(out,3);
 }};export default board;
