// SWE-Interact tests software agents resolving interactive coding tasks.
// The importer reads the paper's single-turn and multi-turn resolve-rate table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2606.30573';
const board:Leaderboard={benchmark:'swe-interact',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[0]?.[0]==='Model'&&x[0]?.includes('Resolve Rate')&&x[1]?.[0]==='Single-turn baseline');if(!t)throw new Error('SWE-Interact table missing');const rows:LeaderboardRow[]=[];let setting='';for(const r of t.slice(2)){if(r[0]==='Multi-turn (Ours)'){setting='Multi-turn';continue;}if(r[0]==='Single-turn baseline'){setting='Single-turn';continue;}const score=Number(String(r[1]).match(/[0-9.]+/)?.[0]);if(!r[0]||!Number.isFinite(score))continue;rows.push({model:r[0],setting,score,metrics:{steps:Number(String(r[2]).match(/[0-9.]+/)?.[0]),tokensMillions:Number(String(r[3]).match(/[0-9.]+/)?.[0])}});}return checked(rows,8);}};export default board;
