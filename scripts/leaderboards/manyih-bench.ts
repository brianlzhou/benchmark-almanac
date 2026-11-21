// ManyIH-Bench measures instruction-conflict resolution accuracy. This importer reads Table 3 of the paper's main results.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2604.09443';
const board:Leaderboard={benchmark:'manyih-bench',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,stats:{test:{name:'Test accuracy',unit:'%',better:'higher'},style:{name:'Style compliance accuracy',unit:'%',better:'higher'}},async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.join('|').includes('Acc test'));if(!t)throw new Error('ManyIH table missing');return checked(t.slice(1).filter(r=>r[0]&&Number.isFinite(Number(r[1]))).map(r=>({model:r[0],score:Number(r[1]),metrics:{test:Number(r[2]),style:Number(r[3])}})),10);}};export default board;
