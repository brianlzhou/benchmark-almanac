// ScholarQABench evaluates scientific question answering with citation correctness and recall. This importer reads the paper's main table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2411.14199';
const board:Leaderboard={benchmark:'scholarqabench',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.[0]===''&&t.some(r=>r[0]==='Llama3-8B'));if(!t)throw new Error('ScholarQABench table missing');const seen=new Set<string>();const rows=t.slice(1).filter(r=>r[0]&&Number.isFinite(Number(r[2]))&&(!seen.has(r[0])&&(seen.add(r[0]),true)));return checked(rows.map(r=>({model:r[0],score:Number(r[2]),metrics:{citationRecall:Number(r[1])}})),7);}};export default board;
