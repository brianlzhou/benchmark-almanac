// YC-Bench: average simulated net worth in US dollars, not API cost. Read the live leaderboard
// and preserve bankruptcy counts and run counts. Keep the Greedy Bot baseline as a named system.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://collinear-ai.github.io/yc-bench/";
const board: Leaderboard = {
 benchmark: "yc-bench", url: "https://collinear-ai.github.io/yc-bench/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.[2]?.text==='Net Worth');if(!t)throw new Error('YC-Bench table missing');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){const model=text(r[1]?.html.match(/class="model-name"[^>]*>([\s\S]*?)<\/span>/)?.[1]??r[1]?.html??'');const score=num(r[2]?.text);if(!model||score===undefined)continue;const b=r[3].text.match(/(\d+)\/(\d+)/);rows.push({model,score,...(b?{metrics:{bankruptRuns:Number(b[1]),runs:Number(b[2])}}:{})});}
return rows;
 },
};
export default board;
