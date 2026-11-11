// WMDP Biology: Appendix Table 3 reports Bio accuracy as a percentage.
// Unlearning changes the model, so each learned variant retains its method in the model name.
// Cyber, chemistry, and unrelated benchmarks do not become Biology rows.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2403.03218";
const board: Leaderboard = {
 benchmark: "wmdp-biology",
 url: "https://arxiv.org/html/2403.03218",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const raw=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Method')&&t[1]?.some(c=>c.text==='Bio'));
 if(!raw)throw new Error('WMDP Appendix result table missing');
 return checked(grid(raw).filter(r=>r.length===11&&num(r[2])!==undefined).map(r=>({model:r[0]+(r[1]==='Base'?'':' + '+r[1].replace(' (ours)','')),score:num(r[2])!})),10);
 },
};
export default board;
