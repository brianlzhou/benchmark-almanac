// LAB-Bench ProtocolQA: the paper's accuracy table covers the entire public and private dataset.
// Accuracy is converted from a fraction to percent. Precision and coverage remain secondary metrics.
// Human references are excluded. Rows are static paper results and will not refresh with later releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2407.10362";
const board: Leaderboard = {
 benchmark: "lab-bench-protocolqa",
 url: "https://arxiv.org/html/2407.10362",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).filter(t=>t[0]?.includes('claude-3-5-sonnet-20240620'));
 if(ts.length!==3) throw new Error('LAB-Bench metric tables changed');
 const rs=ts.map(t=>t.find(r=>r[0]==='ProtocolQA'));
 if(rs.some(r=>!r)) throw new Error('LAB-Bench category missing');
 return checked(ts[0][0].slice(2).map((model,j)=>({model,score:num(rs[0]![j+2])!*100,metrics:{precision:num(rs[1]![j+2])!*100,coverage:num(rs[2]![j+2])!*100}})),7);
 },
};
export default board;
