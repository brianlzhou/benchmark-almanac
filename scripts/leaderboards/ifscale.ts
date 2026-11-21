// IFScale measures keyword instruction-following accuracy as density grows from 10 to 500 instructions.
// The headline is accuracy at the maximum density of 500 instructions, the paper's primary comparison.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2507.11538';
const board:Leaderboard={benchmark:'ifscale',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const rows:LeaderboardRow[]=[];for(const t of ts){if(t[0]?.[0]!=='Model'||t[0]?.[1]!=='Metric')continue;for(let i=1;i<t.length;i++){if(t[i][1]!=='Accuracy (%)')continue;const vals=t[i].slice(2).map(x=>Number(String(x).replace('%','')));if(vals.length<5||vals.some(v=>!Number.isFinite(v)))continue;rows.push({model:t[i][0],score:vals[4],metrics:{density10:vals[0],density50:vals[1],density100:vals[2],density250:vals[3]}});}}return checked(rows,20);}};export default board;
