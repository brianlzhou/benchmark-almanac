// SynLogic tests language models on 35 synthetic logic tasks.
// The importer reads the paper's validation comparison and keeps the SynLogic-Val score as the headline.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2505.19641';
const board:Leaderboard={benchmark:'synlogic',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,parts:{korBench:'KorBench',bbh:'BBH',bbeh:'BBH-E',aime2024:'AIME 2024',math500:'MATH-500',amc2023:'AMC 2023'},async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[0]?.[0]==='Model'&&x[1]?.[1]==='SynLogic -Val');if(!t)throw new Error('SynLogic table missing');const rows:LeaderboardRow[]=[];for(const r of t.slice(2)){const model=r[0],score=Number(r[1]);if(!model||!Number.isFinite(score))continue;rows.push({model,score,metrics:{korBench:Number(r[2]),bbh:Number(r[3]),bbeh:Number(r[4]),aime2024:Number(r[5]),math500:Number(r[6]),amc2023:Number(r[7])}});}return checked(rows,7);}};export default board;
