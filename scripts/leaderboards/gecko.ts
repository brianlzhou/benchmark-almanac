// Gecko evaluates text-to-image generations for word-level, Likert and DSG(H) alignment.
// The paper reports no overall score, so the headline is the first score column, Gecko(R) word-level accuracy.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2404.16820';
const board:Leaderboard={benchmark:'gecko',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,headline:'The paper reports no overall score, so this is the Gecko(R) word-level score, the first score column.',async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[0]?.[0]==='Gen. model'&&x[2]?.[1]==='WL');if(!t)throw new Error('Gecko score table missing');const rows=t.slice(3).map(r=>({model:r[0],score:Number(r[7].split('\\pm')[0])*100,metrics:{geckoRLikert:Number(r[8])*100,geckoRDSGH:Number(r[9])*100,geckoSLikert:Number(r[11].split('\\pm')[0])*100,geckoSDSGH:Number(r[12].split('\\pm')[0])*100}})).filter(r=>Number.isFinite(r.score));return checked(rows,4);}};export default board;
