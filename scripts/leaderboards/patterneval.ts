// Maker-published whole-benchmark aggregate.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
import {inlinePaperTables} from '../lib/boards/arxiv-inline-tables.ts';
const URL="https://arxiv.org/html/2608.12781";
const board:Leaderboard={benchmark:'patterneval', static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=inlinePaperTables(await paperHtml(URL)).find(t=>t[1]?.[5]==='Trigger\\downarrow'&&t[0]?.[1]==='Mode');if(!t)throw new Error('Reviewed overall table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2))out.push({model:c[0],setting:c[1]==='Thk'?'thinking':'non-thinking',score:Number(c[5]),metrics:{accuracy:Number(c[4]),cotFailure:Number(c[6]),repetition:Number(c[7]),contradiction:Number(c[8]),prematureRefusal:Number(c[9])}});return checked(out,3);
 }};export default board;
