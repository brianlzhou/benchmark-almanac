// Overall success across the complete TVRBench suite; memory mode is a setting.
import type {Leaderboard} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2606.01247';
const board:Leaderboard={benchmark:'tvrbench', static: 'paper', parts: {
  singleEasy: { name: 'Single easy', group: 'Split' },
  singleHard: { name: 'Single hard', group: 'Split' },
  multiEasy: { name: 'Multi easy', group: 'Split' },
  multiHard: { name: 'Multi hard', group: 'Split' },
},url:URL,feed:URL,terms:PAPER_TERMS,
 stats:{steps:{name:'Steps',unit:'count'},falseStop:{name:'False stop rate',unit:'%',better:'lower'}},
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[0]==='Model'&&t[0]?.length===11&&t[0]?.[1]?.startsWith('Overall'));if(!t)throw new Error('Overall results missing');
 return checked(t.slice(1).filter(c=>c[0]!=='Human').map(c=>{const m=c[0].match(/^(.+) \((VA|AO)\)$/);if(!m)throw new Error('Unknown memory setting');return {model:m[1],setting:m[2]==='VA'?'visual-action memory':'action-only memory',score:Number(c[1]),metrics:{singleEasy:Number(c[2]),singleHard:Number(c[3]),multiEasy:Number(c[4]),multiHard:Number(c[5]),steps:Number(c[6]),falseStop:Number(c[7])}};}),3);
 }};export default board;
