// JAMA Clinical Challenge tests medical multiple-choice answering and explanation.
// This importer reads Table 2 of the benchmark paper and uses zero-shot answer accuracy.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2402.18060';
const board:Leaderboard={benchmark:'jama-clinical-challenge',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){
 const table=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[0]==='Prompting');
 if(!table) throw new Error('JAMA prediction table missing');
 const names=table[1]?.slice(2); const row=table.find(r=>r[1]==='JAMA'&&r[0]!=='X→RY');
 if(!names||!row||names.length<7) throw new Error('JAMA table columns changed');
 return checked(names.map((model,i)=>({model,setting:'zero-shot X→Y',score:Number(row[i+2])})),7);
}};
export default board;
