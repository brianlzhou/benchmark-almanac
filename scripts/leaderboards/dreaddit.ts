// Dreaddit evaluates stress detection in Reddit posts.
// Table 6 reports supervised model F1 scores on the test set.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://arxiv.org/html/1911.00133';
const board:Leaderboard={benchmark:'dreaddit',static:'paper',url:FEED,feed:FEED,terms:PAPER_TERMS,async fetch():Promise<LeaderboardRow[]> { const t=paperTables(await paperHtml(FEED)).map(grid).find(t=>t[0]?.join('|')==='Model|P|R|F'); if(!t)throw new Error('Dreaddit table missing'); const rows=t.slice(1).filter(r=>r[0]&&!/^(?:Majority baseline|n-gram baseline)/i.test(r[0])).map(r=>({model:r[0].replace(/\*/g,''),score:Number(r[3])*100,metrics:{precision:Number(r[1])*100,recall:Number(r[2])*100}})); return checked(rows,8); }}; export default board;
