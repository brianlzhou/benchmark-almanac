// TVBench: Table 5 TVBench Average is whole-benchmark accuracy in percent, not the adjacent MVBench score.
// Input modes are whole-benchmark configurations. Task scores remain metrics. Random and human references are excluded.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2410.07752";
const board: Leaderboard = {
 benchmark: "tvbench",
 url: "https://arxiv.org/html/2410.07752",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const raw=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='MVBench')&&t[0]?.some(c=>c.text==='TVBench'));
 if(!raw) throw new Error('TVBench Table 5 missing');
 const t=grid(raw); const rows:LeaderboardRow[]=[];
 for(const r of t.slice(2)) {
 if(/Random|Human Baseline/.test(r[0])||num(r[3])===undefined)continue;
 rows.push({model:r[0],setting:r[1].replace(/text-\s*only/,'text only')||'video',score:num(r[3])!,metrics:Object.fromEntries(['AC','OC','AS','OS','ST','AL','AA','UA','ES','MD'].map((k,i)=>[k,num(r[4+i])!]))});
 }
 return checked(rows,40);
 },
};
export default board;
