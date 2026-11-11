// Progress-Bench: Table 1 Macro Avg Normalized Score Error is the headline, lower is better.
// The catalog must set better to lower before merging. PRC and AFRR are secondary metrics.
// Rows use direct prediction. Colored reasoning deltas are not absolute scores. The Human Bench transfer set is excluded.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2601.15224";
const board: Leaderboard = {
 benchmark: "progress-bench",
 url: "https://arxiv.org/html/2601.15224",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(grid).find(t=>t[0]?.[10]==='Macro Avg');if(!t)throw new Error('Progress-Bench macro table missing');
 return checked(t.slice(2).map(r=>{const metrics:Record<string,number>={};for(const [k,c] of [['macroPrc',11],['macroAfrr',12],['microNse',7],['visionNse',1],['textNse',4]] as const){const n=num(r[c]);if(n!==undefined)metrics[k]=n;}return {model:r[0].replace('Intern3.5-VL','InternVL3.5'),score:num(r[10])!,setting:'direct prediction',metrics};}),15);
 },
};
export default board;
