// DeR²-Bench: accuracy percentage under four retrieval conditions. Preserve each condition as a
// setting, reasoning effort separately within that label, and retrieval loss as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://retrieval-infused-reasoning-sandbox.github.io/";
const board: Leaderboard = {
 benchmark: "der2-bench", url: "https://retrieval-infused-reasoning-sandbox.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text==='Instruction-Only');if(!t)throw new Error('DeR2 table missing');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){if(/^Average/.test(r[0].text))continue;let model=r[0].text.replace(/^OpenAI-/,'');const effort=model.match(/-(high|thinking)$/i);if(effort)model=model.slice(0,effort.index);for(let i=1;i<=4;i++){const score=num(r[i].text);if(score!==undefined)rows.push({model,score,setting:[t[0][i].text,effort?.[1]].filter(Boolean).join('; '),metrics:{retrievalLoss:num(r[5].text)!}});}}
return rows;
 },
};
export default board;
