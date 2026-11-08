// VSI-Bench: the main table Avg. column scores the full benchmark in percent. Tiny-split and chance references are excluded.
// The eight task scores remain metrics.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2412.14171";
const board: Leaderboard = {
 benchmark: "vsi-bench",
 url: "https://arxiv.org/html/2412.14171",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t.some(r=>r.includes('VSI-Bench (tiny) Perf.')));
 if(!t)throw new Error('VSI-Bench main table missing');
 return checked(t.filter(r=>r.length===11 && /^\d+$/.test(r[1])).map(r=>({model:r[0],score:num(r[2])!,metrics:Object.fromEntries(['objectCount','absoluteDistance','objectSize','roomSize','relativeDistance','relativeDirection','routePlan','approachOrder'].map((k,i)=>[k,num(r[i+3])!]))})),15);
 },
};
export default board;
