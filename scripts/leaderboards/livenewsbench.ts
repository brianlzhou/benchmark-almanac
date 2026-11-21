// LiveNewsBench tests current-news question answering with human-verified answers.
// The headline is the Human-Verified LiveNewsBench percentage. FreshQA and SealQA remain metrics.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2602.13543';
const board:Leaderboard={benchmark:'livenewsbench',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,stats:{freshQaOverall:{name:'FreshQA overall',unit:'%',better:'higher'},freshQaFastChanging:{name:'FreshQA fast-changing',unit:'%',better:'higher'},sealQaOverall:{name:'SealQA overall',unit:'%',better:'higher'},sealQaFastChanging:{name:'SealQA fast-changing',unit:'%',better:'higher'}},async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(x=>x[0]?.[1]==='LiveNewsBench (%)');if(!t)throw new Error('LiveNewsBench table missing');const rows=t.slice(3).map(r=>({model:r[0],score:Number(r[1]),metrics:{freshQaOverall:Number(r[2]),freshQaFastChanging:Number(r[3]),sealQaOverall:Number(r[4]),sealQaFastChanging:Number(r[5])}}));return checked(rows,7);}};export default board;
