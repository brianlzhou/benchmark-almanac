// Full XSum test set, ROUGE-L in the paper's original 0–100 units.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {flatPaperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/1808.08745';
const board:Leaderboard={benchmark:'xsum',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=flatPaperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.join('|')==='Models|R1|R2|RL');if(!t)throw new Error('ROUGE table missing');
 return checked(t.slice(1).filter(c=>/^\d/.test(c[3])&&!['Random','lead','ext-oracle'].includes(c[0])).map(c=>{const m=c[0].match(/^(T-ConvS2S) \((.*)\)$/);return {model:m?.[1]??c[0],setting:m?.[2],score:Number(c[3]),metrics:{rouge1:Number(c[1]),rouge2:Number(c[2])}};}),3);
 }};export default board;
