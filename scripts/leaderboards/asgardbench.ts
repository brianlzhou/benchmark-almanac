// AsgardBench tests visually grounded interactive planning under minimal feedback.
// The headline is the paper's Baseline success percentage across the benchmark.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2603.15888';
const board:Leaderboard={benchmark:'asgardbench',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[0]?.[0]==='Model'&&x[0]?.[1]==='Baseline');if(!t)throw new Error('AsgardBench table missing');return checked(t.slice(1).map(r=>({model:r[0],score:Number(r[1]),metrics:{detailed:Number(r[2]),noFeedback:Number(r[3]),noHand:Number(r[4]),noMemory:Number(r[5]),noPrevImage:Number(r[6]),textOnlyFsF:Number(r[7]),textOnlyFdF:Number(r[8]),textOnlyFnF:Number(r[9])}})).filter(r=>Number.isFinite(r.score)),7);}};export default board;
