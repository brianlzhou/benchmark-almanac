// Full 4084-question accuracy under CoT and direct-answer prompting.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2609.05405';
const board:Leaderboard={benchmark:'wearableqa',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.join('|')==='Model|CoT|DA|Gap');if(!t)throw new Error('Overall prompting table missing');
 return checked(t.slice(1).flatMap(c=>[{model:c[0],setting:'row input; CoT',score:Number(c[1])},{model:c[0],setting:'row input; direct answer',score:Number(c[2])}]),3);
 }};export default board;
