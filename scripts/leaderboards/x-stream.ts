// Maker's Overall streaming score. Individual task scores remain metrics.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {flatPaperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2606.02482';
const board:Leaderboard={benchmark:'x-stream', static: 'paper', parts: {
  instant: { name: 'Instant', group: 'Task type' },
  backward: { name: 'Backward', group: 'Task type' },
  forward: { name: 'Forward', group: 'Task type' },
  comprehensive: { name: 'Comprehensive', group: 'Task type' },
},url:URL,feed:URL,terms:PAPER_TERMS,
 stats:{earlyResponse:{name:'Early response rate',unit:'%',better:'lower',note:'Proportion of responses before the proactive timestamp.'},noResponse:{name:'No response rate',unit:'%',better:'lower',note:'Proportion of questions with no response within the response window.'}},
 async fetch(){const t=flatPaperTables(await paperHtml(URL)).map(grid).find(t=>t[1]?.[1]==='Overall'&&t[1]?.[2]==='Instant');if(!t)throw new Error('Overall results missing');
 return checked(t.slice(2).filter(c=>/^\d/.test(c[1])&&!c[0].startsWith('Human')).map(c=>({model:c[0],score:Number(c[1]),metrics:{instant:Number(c[2]),backward:Number(c[3]),forward:Number(c[4]),comprehensive:Number(c[5]),earlyResponse:Number(c[6]),noResponse:Number(c[7])}})),3);
 }};export default board;
