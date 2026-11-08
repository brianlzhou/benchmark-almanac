// SimpleVQA: Table 3 reports overall Correct (CO), the answer accuracy in percent.
// The other overall metrics, including F-score, are secondary metrics. Table 6 adds text-only runs.
// Rows are the static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
import { grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2502.13059";
const board: Leaderboard = {
 benchmark: "simplevqa",
 url: "https://arxiv.org/html/2502.13059",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));
 const t=ts.find(t=>t[0]?.includes('Overall results'));
 const blind=ts.find(t=>t[0]?.join('|')==='Models|CO|IN|NA|CGA');
 if(!t || !blind) throw new Error('SimpleVQA result tables missing');
 const rows:LeaderboardRow[]=t.filter(r=>r.length===15 && num(r[1])!==undefined).map(r=>({model:r[0],score:num(r[1])!,setting:'image and text',metrics:Object.fromEntries(['notAttempted','incorrect','correctGivenAttempted','fScore','LS','OIR','TE','PE','LB','TP','QPR','AC','OAR'].map((k,i)=>[k,num(r[i+2])!]))}));
 for(const r of blind.slice(1)) rows.push({model:r[0],score:num(r[1])!,setting:'text only',metrics:{incorrect:num(r[2])!,notAttempted:num(r[3])!,correctGivenAttempted:num(r[4])!}});
 return checked(rows,26);
 },
};
export default board;
