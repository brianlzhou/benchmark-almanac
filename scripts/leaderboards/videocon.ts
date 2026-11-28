// VideoCon tests video-language entailment and related explanation and retrieval tasks.
// The paper reports no combined score, so the headline is VideoCon LLM Test entailment accuracy, the primary test.
// Table 2 reports seven named models on LLM, human, and human-hard entailment sets.
import type {Leaderboard,LeaderboardRow} from './types.ts';import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';const URL='https://arxiv.org/html/2311.10111';
const board:Leaderboard={
  benchmark:'videocon',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,
  parts:{
    human:{name:'Human test',group:'Split'},
    humanHard:{name:'Human hard test',group:'Split'},
  },
  headline:'The paper reports no combined score, so this is VideoCon LLM Test entailment accuracy, the primary test.',async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[0]?.[0]==='Models'&&x[0]?.includes('VideoCon (LLM) Test'));if(!t)throw new Error('VideoCon table missing');const rows:LeaderboardRow[]=[];for(const r of t.slice(1)){const model=r[0];const score=Number(r[1]);if(!model||model==='Random'||!Number.isFinite(score))continue;rows.push({model,score,metrics:{human:Number(r[2]),humanHard:Number(r[3])}});}return checked(rows,5);}};export default board;
