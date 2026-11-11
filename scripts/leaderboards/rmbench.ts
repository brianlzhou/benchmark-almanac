// RMBench: Total Average is the published success percentage across all nine memory tasks.
// Single-memory and multi-memory averages remain metrics, together with task success rates.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2603.01229";
const board: Leaderboard = {
 benchmark: "rmbench",
 url: "https://arxiv.org/html/2603.01229",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('TMC')&&t.some(r=>r[0]==='Total Average'));
 if(!t)throw new Error('RMBench total table missing');const total=t.find(r=>r[0]==='Total Average')!;const avgs=t.filter(r=>r[0]==='Average');
 return checked(t[0].slice(2).map((model,j)=>({model:model.replace(' (ours)',''),score:num(total[j+2])!,metrics:{singleMemory:num(avgs[0][j+2])!,multiMemory:num(avgs[1][j+2])!,...Object.fromEntries(t.slice(1).filter(r=>!r[0].includes('Average')).map(r=>[r[0],num(r[j+2])!]))}})),8);
 },
};
export default board;
