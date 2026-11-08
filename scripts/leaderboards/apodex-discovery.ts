// TRACES, the current official Apodex Discovery leaderboard, reports 0–4 overall capability ratings.
// Preserves model/harness combinations, six dimensions, policy refusals and incomplete rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://www.discovertraces.ai/liveleaderboard/the-traces-leaderboard";
const board: Leaderboard = {
 benchmark: "apodex-discovery", url: "https://www.discovertraces.ai/liveleaderboard/the-traces-leaderboard", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.at(-1)?.text==='Overall');if(!t)throw new Error('Missing TRACES table');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){const score=num(r[11]?.text);if(score===undefined)continue;const metrics:Record<string,number>={};for(let i=3;i<11;i++){const v=num(r[i].text);if(v!==undefined)metrics[t[0][i].text]=v;}
rows.push({model:r[1].text,harness:r[2].text,score,setting:'TRACES',metrics});}return rows;
 },
};
export default board;
