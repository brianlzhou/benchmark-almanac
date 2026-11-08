// PlanBench-XL: Table 3 reports grounded task-completion accuracy for the default setting.
// Exploration and execution metrics remain on the overall row.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2606.22388";
const board: Leaderboard = {
 benchmark: "planbench-xl",
 url: "https://arxiv.org/html/2606.22388",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('Task Completion'));
 if(!t)throw new Error('PlanBench-XL results missing');
 return checked(t.filter(r=>r.length===8&&num(r[1])!==undefined).map(r=>({model:r[0],score:num(r[1])!,metrics:Object.fromEntries(['egtPrecision','turns','meanEDT','scRatio','itcr','uirr'].map((k,i)=>[k,num(r[i+2])!]))})),10);
 },
};
export default board;
