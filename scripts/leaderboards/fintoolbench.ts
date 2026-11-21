// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2603.08262";
const board:Leaderboard={benchmark:"fintoolbench", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Model\",\"TIR\",\"TESR\",\"CER \\\\uparrow\",\"Soft Score \\\\uparrow\",\"CSS \\\\uparrow\",\"TMR \\\\downarrow\",\"IMR \\\\downarrow\",\"DMR \\\\downarrow\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1))out.push({model:c[0],score:Number(c[4]),metrics:{toolInvocation:Number(c[1]),toolExecutionSuccess:Number(c[2]),conditionalExecution:Number(c[3]),conditionalSoftScore:Number(c[5]),timelinessMismatch:Number(c[6]),intentMismatch:Number(c[7]),domainMismatch:Number(c[8])}});
 return checked(out,3);
 }};export default board;
