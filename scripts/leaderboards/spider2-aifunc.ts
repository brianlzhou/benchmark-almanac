// Spider 2.0-AIFunc measures execution accuracy for AI-native SQL generation. This importer reads the paper's main model table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2607.06229';
const board:Leaderboard={benchmark:'spider2-aifunc',static:'paper',url:URL,feed:URL,terms:PAPER_TERMS,async fetch(){const t=paperTables(await paperHtml(URL)).map(grid).find(t=>t[0]?.join('|').includes('Exec. (%)'));if(!t)throw new Error('Spider AIFunc table missing');return checked(t.slice(1).filter(r=>r[0]&&!/MODELS/.test(r[0])).map(r=>({model:r[0],score:Number(r[3]),metrics:{execution:Number(r[2])}})),10);}};export default board;
