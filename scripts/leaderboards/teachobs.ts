// TeachObs evaluates vision-capable models on classroom observation coding.
// The paper reports no single overall score, so the headline is Track 1-1 macro F1, the first track.
// Table 5 reports Track 1-1, Track 1-2, and Track 2 scores for five named models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2605.30673';
const board:Leaderboard={benchmark:'teachobs',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,headline:'The paper reports no overall score, so this is Track 1-1 macro F1, the first track.',async fetch(){
 const ts=paperTables(await paperHtml(URL)).map(grid); const t=ts.find(x=>x[0]?.includes('Track 1-1 (text)')&&x[1]?.[0]==='Model'); if(!t) throw new Error('TeachObs table missing'); const rows:LeaderboardRow[]=[];
 for(const r of t.slice(2)){const model=r[0],score=Number(r[1]); if(!model||model==='Average'||!Number.isFinite(score)) continue; rows.push({model,score,metrics:{track11Micro:Number(r[2]),track12Macro:Number(r[3]),track12Micro:Number(r[4]),track2Macro:Number(r[5]),track2Micro:Number(r[6])}});} return checked(rows,5);
}}; export default board;
