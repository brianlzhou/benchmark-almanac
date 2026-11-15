// Maker-published whole-benchmark aggregate.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
import {inlinePaperTables} from '../lib/boards/arxiv-inline-tables.ts';
const URL="https://arxiv.org/html/2501.03124";
const board:Leaderboard={benchmark:'prmbench',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=inlinePaperTables(await paperHtml(URL)).find(t=>t[0]?.[1]==='Overall'&&t[0]?.length===14);if(!t)throw new Error('Reviewed overall table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){if(c[0]==='Avg.'||c[0].startsWith('Human')||!/^[-\d.]+$/.test(c[1]))continue;out.push({model:c[0].replace(/ †$/,''),score:Number(c[1]),metrics:{simplicity:Number(c[4]),soundness:Number(c[9]),sensitivity:Number(c[13])}});}return checked(out,3);
 }};export default board;
