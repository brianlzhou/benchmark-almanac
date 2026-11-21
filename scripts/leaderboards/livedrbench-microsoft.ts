// LiveDRBench evaluates deep-research systems with claim precision, recall and F1. This importer reads the paper's average table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2508.04183';
const board:Leaderboard={benchmark:'livedrbench-microsoft',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t.some(r=>r[0]==='Average'));if(!t)throw new Error('LiveDR average table missing');const row=t.find(r=>r[0]==='Average')!;const names=['OpenAI Deep Research','Perplexity Deep Research','Gemini Deep Research'];return checked(names.map((model,i)=>({model,score:Number(row[3+i*3])*100,metrics:{precision:Number(row[1+i*3]),recall:Number(row[2+i*3])}})),3);}};export default board;
