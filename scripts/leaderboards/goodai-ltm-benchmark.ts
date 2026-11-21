// Published full-test aggregate. Preserve author units and configurations.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2409.20222";
const board:Leaderboard={benchmark:'goodai-ltm-benchmark', static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>JSON.stringify(t[0])==="[\"\",\"\",\"Isolated\",\"Isolated\",\"2k\",\"2k\",\"32k\",\"32k\",\"120k\",\"120k\",\"200k\",\"200k\",\"500k\",\"500k\"]");if(!t)throw new Error('Reviewed table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(2)){const m=c[0].match(/^(LTM|MemGPT|MemoryBank) (.+)$/);for(const i of [2,6,8,10,12])out.push({model:m?m[2]:c[0],harness:m?.[1],score:Number(c[i]),setting:t[0][i]+' memory span; input context '+c[1]+' tokens; score out of 11',metrics:{std:Number(c[i+1])}});}return checked(out,3);
 }};export default board;
