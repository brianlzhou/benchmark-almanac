// Spyfall study tests language models playing the social deduction game across locations and languages.
// The importer reads the paper's Bradley-Terry rating table, with overall rating as the headline.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2601.09017';
const board:Leaderboard={benchmark:'spyfall-study',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){
 const ts=paperTables(await paperHtml(URL)).map(grid); const t=ts.find(x=>x[0]?.[1]==='Model'&&x[0]?.includes('Overall'));
 if(!t)throw new Error('Spyfall overall table missing'); const rows:LeaderboardRow[]=[];
 for(const r of t.slice(2)){const model=r[1],m=String(r[2]||'').match(/(-?\d+(?:\.\d+)?)/);if(!model||!m)continue;rows.push({model,score:Number(m[1]),metrics:{genericEn:Number(String(r[3]).match(/\d+/)?.[0]),genericId:Number(String(r[4]).match(/\d+/)?.[0]),genericArz:Number(String(r[5]).match(/\d+/)?.[0]),genericZh:Number(String(r[6]).match(/\d+/)?.[0])}});}return checked(rows,6);
}};export default board;
