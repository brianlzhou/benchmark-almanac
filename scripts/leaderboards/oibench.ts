// OIBench: use the published original Overall accepted rate, not Pseudo or Derived.
// Language and programming-language scores remain metrics.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { flatPaperTables } from '../lib/boards/arxiv-h2.ts';
const FEED = "https://arxiv.org/html/2506.10481";
const board: Leaderboard = {
 benchmark: "oibench",
 url: "https://arxiv.org/html/2506.10481",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=flatPaperTables(await fetchText(FEED)).map(grid).find(t=>t[0]?.[1]==='OIBench'&&t[1]?.[1]==='Overall');
 if(!t)throw new Error('OIBench Overall missing');
 return checked(t.slice(2).filter(r=>num(r[1])!==undefined).map(r=>{let model=r[0].replace(/\s*\[.*$/,'');const effort=/-high$/i.test(model);if(effort)model=model.replace(/-high$/i,'');return {model,score:num(r[1])!,setting:effort?'high':undefined,metrics:Object.fromEntries(['cpp','java','python','javascript','english','chinese'].map((k,i)=>[k,num(r[i+2])!]))};}),18);
 },
};
export default board;
