// SWAG tests commonsense sentence-ending selection.
// The importer reads the paper's main test table and uses context plus the second sentence with generated endings.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/1808.05326';
const board:Leaderboard={benchmark:'swag',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,stats:{endingOnlyTest:{name:'Ending-only test accuracy',unit:'%',better:'higher'},secondSentenceTest:{name:'Second-sentence test accuracy',unit:'%',better:'higher'},contextSecondSentenceTest:{name:'Context plus second-sentence test accuracy',unit:'%',better:'higher'}},async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[2]?.[1]==='Model'&&x[2]?.[2]==='Model');if(!t)throw new Error('SWAG table missing');const rows:LeaderboardRow[]=[];for(const r of t.slice(6)){const model=r[2],score=Number(r[14]);if(!model||model==='Human'||!Number.isFinite(score))continue;rows.push({model,score,metrics:{endingOnlyTest:Number(r[6])||0,secondSentenceTest:Number(r[10])||0,contextSecondSentenceTest:score}});}return checked(rows,10);}};export default board;
