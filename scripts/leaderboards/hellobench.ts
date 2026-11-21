// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2409.16191";
const board:Leaderboard={benchmark:"hellobench", static: 'paper', parts: {
  qa: { name: 'Question answering', group: 'Task type' },
  summarization: { name: 'Summarization', group: 'Task type' },
  chat: { name: 'Chat', group: 'Task type' },
  completion: { name: 'Completion', group: 'Task type' },
  heuristicGeneration: { name: 'Heuristic generation', group: 'Task type' },
},url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Models\",\"OEQA\",\"OEQA\",\"Summ\",\"Summ\",\"Chat\",\"Chat\",\"TC\",\"TC\",\"HTG\",\"HTG\",\"AVG\",\"AVG\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){if(!/^-?[\d.]+$/.test(c[11]))continue;out.push({model:c[0],score:Number(c[11]),metrics:{wordCount:Number(c[12]),qa:Number(c[1]),summarization:Number(c[3]),chat:Number(c[5]),completion:Number(c[7]),heuristicGeneration:Number(c[9])}});}
 return checked(out,3);
 }};export default board;
