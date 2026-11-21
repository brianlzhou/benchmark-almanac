// RSLiveBench-UAV tests remote-sensing embodied agents on 2D, 3D, cross-view and reasoning tasks.
// The score is the paper's Overall score on Start-10 full.
// This importer reads Table 2 from the paper HTML.
import type {Leaderboard,LeaderboardRow} from './types.ts';import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2611.14953';const board:Leaderboard={benchmark:'rslivebench-uav',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,async fetch(){const t=grid(paperTables(await paperHtml(FEED))[7]);const rows=t.slice(2).filter(r=>r[0]&&!/MLLMs$/.test(r[0])).map(r=>({model:r[0].replace(/\s*\[.*\]$/,''),score:Number(r[1]),metrics:{twoD:Number(r[2]),threeD:Number(r[3]),crossView:Number(r[4]),reasoning:Number(r[5])}}));return checked(rows,10);}};export default board;
