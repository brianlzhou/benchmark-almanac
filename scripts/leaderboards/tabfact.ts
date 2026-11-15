// Full test accuracy. Small test and complexity splits are diagnostics only.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/1909.02164v5';
const board:Leaderboard={benchmark:'tabfact',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[2]==='Test'&&t[0]?.[3]==='Test (simple)');if(!t)throw new Error('Full test table missing');
 return checked(t.slice(1).filter(c=>/^\d/.test(c[2])).map(c=>{let model=c[0],setting:string|undefined;const m=model.match(/^(Table-BERT)-(.+)$/);if(m){model=m[1];setting=m[2];}return {model,setting,score:Number(c[2]),metrics:{validation:Number(c[1]),simple:Number(c[3]),complex:Number(c[4]),smallTest:Number(c[5])}};}),3);
 }};export default board;
