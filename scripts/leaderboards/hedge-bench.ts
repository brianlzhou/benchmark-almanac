// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2606.03918";
const board:Leaderboard={benchmark:"hedge-bench",url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Model\",\"Effort\",\"T1\",\"T2\",\"T3\",\"Joint (%)\",\"Coverage (%)\",\"Accuracy (%)\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1))out.push({model:c[0],score:Number(c[5]),trials:3,setting:'Hedge-Bench-Public; effort '+c[1],metrics:{coverage:Number(c[6]),accuracy:Number(c[7])}});
 return checked(out,3);
 }};export default board;
