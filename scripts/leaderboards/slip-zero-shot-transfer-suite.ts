// The SLIP zero-shot transfer suite measures image-text models across 26 classification datasets.
// The score is the paper's Average across the suite, with each dataset retained as a metric.
// This importer reads Table 4 from the paper HTML.
import type {Leaderboard,LeaderboardRow} from './types.ts';import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2112.12750';const board:Leaderboard={benchmark:'slip-zero-shot-transfer-suite',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,async fetch(){const t=grid(paperTables(await paperHtml(FEED))[4]);const headers=t[0].slice(1);const rows=t.slice(1).map(r=>({model:r[0],setting:r[1],score:Number(r.at(-1)),metrics:Object.fromEntries(headers.slice(0,-1).map((h,i)=>[h.replace(/[^A-Za-z0-9]+/g,''),Number(r[i+2])]))}));return checked(rows,9);}};export default board;
