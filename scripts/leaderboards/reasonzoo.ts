// ReasonZoo evaluates reasoning under adversarial and neutralized evidence conditions.
// The score is the paper's Aggregate accuracy across MMLU-Pro, GPQA Diamond, Physics and SuperGPQA-Calc.
// This importer reads the cross-model shared evaluation table from the paper HTML.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {flatPaperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2508.15754';
const board:Leaderboard={benchmark:'reasonzoo',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,async fetch(){const t=grid(flatPaperTables(await paperHtml(FEED))[8]);const agg=t.find(r=>r[0]==='Aggregate');if(!agg)throw new Error('ReasonZoo aggregate row missing');const names=['Qwen3-Coder-30B','30B-NV','Qwen3.5-9B'];const rows=names.map((model,i)=>({model,score:Number(agg[1+i*4]),metrics:{mixMV:Number(agg[1+i*4]),cisc:Number(agg[2+i*4]),case:Number(agg[3+i*4])}}));return checked(rows,3);}};export default board;
