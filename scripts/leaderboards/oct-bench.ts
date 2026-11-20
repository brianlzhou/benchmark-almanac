// Published full-test aggregate. Preserve author units and configurations.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2607.16609";
const board:Leaderboard={benchmark:'oct-bench', parts: {
  perception: { name: 'Perception', group: 'Task type' },
  cognition: { name: 'Cognition', group: 'Task type' },
  reasoning: { name: 'Reasoning', group: 'Task type' },
},url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"Model\",\"Overall\",\"Perception\",\"Cognition\",\"Reasoning\"]");if(!t)throw new Error('Reviewed table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1)){if(!/^[\d.]+$/.test(c[1]))continue;out.push({model:c[0],score:Number(c[1]),metrics:{perception:Number(c[2]),cognition:Number(c[3]),reasoning:Number(c[4])}});}return checked(out,3);
 }};export default board;
