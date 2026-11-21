// TMSV Speech Enhancement evaluates audio-visual enhancement quality.
// The paper reports no combined score, so the headline is the PESQ column, the first metric in its main table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2005.11769';
const board:Leaderboard={benchmark:'tmsv-speech-enhancement',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,headline:'The paper reports no combined score, so this is the PESQ column, which it presents first.',async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[0]?.includes('PESQ')&&x[0]?.includes('STOI'));if(!t)throw new Error('TMSV table missing');const rows:LeaderboardRow[]=[];for(const r of t.slice(1)){const model=r[0],score=Number(r[1]);if(!model||model==='Noisy'||!Number.isFinite(score))continue;rows.push({model,score,metrics:{stoi:Number(r[2])}});}return checked(rows,4);}};export default board;
