// B-MoCA tests mobile computer agents on Android tasks under varied device settings.
// The score is the paper's average task success rate in percent.
// This importer reads Table 2 of the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperTables } from '../lib/boards/arxiv-nested-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2404.16660';
const board:Leaderboard={benchmark:'b-moca',static:'paper',url:URL,feed:URL,terms:'The authors publish the paper publicly at https://arxiv.org/abs/2404.16660.',async fetch(){
 const ts=await paperTables(URL); const t=ts[2]; if(!t)throw new Error('B-MoCA Table 2 missing');
 const row=t.find(r=>r[0]?.text==='Average'); if(!row)throw new Error('B-MoCA Average row missing');
 const zero=Number(row[1]?.text.match(/\d+/)?.[0]), few=Number(row[2]?.text.match(/\d+/)?.[0]);
 if(!Number.isFinite(zero)||!Number.isFinite(few))throw new Error('B-MoCA average scores missing');
 return checked([{model:'GPT-4o',setting:'zero-shot',score:zero},{model:'GPT-4o',setting:'few-shot',score:few}],2);
}};export default board;
