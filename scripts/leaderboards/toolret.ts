// Published average nDCG@10 across all three ToolRet domains, in the paper's 0–100 units.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2503.01763';
const board:Leaderboard={benchmark:'toolret', static: 'paper', parts: {
  webNdcg: { name: 'Web', group: 'Category' },
  codeNdcg: { name: 'Code', group: 'Category' },
  customNdcg: { name: 'Custom', group: 'Category' },
},url:URL,feed:URL,terms:PAPER_TERMS,stats:{completenessAt10:{name:'Completeness at 10',unit:'score',better:'higher'}},
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid).filter(t=>t[0]?.[13]==='Average'&&t[0]?.length===15);if(ts.length!==2)throw new Error('Reviewed instruction tables changed');const out:LeaderboardRow[]=[];
 ts.forEach((t,i)=>{for(const c of t.slice(2)){if(!/^\d/.test(c[13]))continue;out.push({model:c[0].replace(/\s*♠/g,''),setting:i===0?'query only':'query and instruction',score:Number(c[13]),metrics:{completenessAt10:Number(c[14]),webNdcg:Number(c[1]),codeNdcg:Number(c[5]),customNdcg:Number(c[9])}});}});return checked(out,3);
 }};export default board;
