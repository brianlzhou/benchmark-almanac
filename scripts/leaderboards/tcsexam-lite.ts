// TCSExam-Lite evaluates theorem proving, solver engineering, constructions and open-conjecture work. This importer reads Table 3.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {flatPaperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2611.07962';
const board:Leaderboard={benchmark:'tcsexam-lite',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const h=await paperHtml(URL),a=h.indexOf('<figure id="S5.T3"'),b=h.indexOf('</figure>',a);if(a<0||b<0)throw new Error('TCSExam Lite table missing');const t=grid(flatPaperTables(h.slice(a,b+9))[0]);return checked(t.slice(1).map(r=>({model:r[0],score:Number(r[5]),metrics:{theorem:Number(r[1]),solver:Number(r[2]),constructions:Number(r[3]),conjectures:Number(r[4])}})),9);}};export default board;
