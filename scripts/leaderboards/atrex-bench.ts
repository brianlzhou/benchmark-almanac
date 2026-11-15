// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2607.14541";
const board:Leaderboard={benchmark:"atrex-bench",url:URL,feed:URL,terms:PAPER_TERMS,aliases:{},
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"\",\"Pass rate (%)\",\"Pass rate (%)\",\"Pass rate (%)\",\"Roofline\",\"vs. baseline (\\\\times)\",\"vs. baseline (\\\\times)\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2))out.push({model:c[0],score:Number(c[4]),setting:'XPU-A; 30 operators',metrics:{compile:Number(c[1]),correct:Number(c[2]),flyDSL:Number(c[3]),torchCompileSpeedup:Number(c[5]),productionSpeedup:Number(c[6])}});
 return checked(out,3);
 }};export default board;
