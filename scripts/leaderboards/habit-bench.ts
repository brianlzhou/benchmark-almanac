// HABIT-Bench: the published Macro column is accuracy across four domains.
// Memory methods are harnesses. Exclude pooled method averages.
// The appendix adds smaller Qwen3 models under the earlier reader protocol.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';
const FEED = "https://arxiv.org/html/2610.24520";
const board: Leaderboard = {
 benchmark: "habit-bench",
 url: "https://arxiv.org/html/2610.24520",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=flatPaperTables(await fetchText(FEED)).map(grid);const main=ts.find(t=>t[0]?.[1]==='Qwen3-235B-A22B'&&t[1]?.[5]==='Macro');if(!main)throw new Error('HABIT main missing');const rows:LeaderboardRow[]=[];
 for(const r of main.slice(2)){if(num(r[5])===undefined||/avg\./.test(r[0]))continue;for(const c of [1,6])rows.push({model:main[0][c],harness:r[0],score:num(r[c+4])!,metrics:Object.fromEntries(['food','finance','software','travel'].map((k,i)=>[k,num(r[c+i])!]))});}
 const scale=ts.find(t=>t[0]?.join('|')==='Method|4B|8B|14B|32B|235B-A22B');if(!scale)throw new Error('HABIT scale table missing');
 for(const r of scale.slice(1))for(let c=1;c<=4;c++)rows.push({model:'Qwen3-'+scale[0][c],harness:r[0],setting:'earlier reader protocol',score:num(r[c])!});return checked(rows,60);
 },
};
export default board;
