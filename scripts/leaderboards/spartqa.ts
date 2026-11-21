// SpartQA tests spatial reasoning over synthetic and human-authored scene descriptions.
// The score is the paper's average accuracy across FB, FR, CO and YN question types.
// This importer reads Table 2 from the paper HTML and skips majority and human baselines.
import type {Leaderboard,LeaderboardRow} from './types.ts';import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/2104.05832';const board:Leaderboard={benchmark:'spartqa',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,async fetch(){const t=grid(paperTables(await paperHtml(FEED))[2]);const rows=t.slice(1).filter(r=>r[1]&&!/^(Majority|Human)$/.test(r[1])).map(r=>({model:r[1],score:Number(r[6]),metrics:{fb:Number(r[2]),fr:Number(r[3]),co:Number(r[4]),yn:Number(r[5])}}));return checked(rows,4);}};export default board;
