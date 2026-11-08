// KRIS-Bench image editing, overall score on the published 0–100 scale.
// Retains factual, conceptual and procedural knowledge metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://yongliang-wu.github.io/kris_bench_project_page/";
const board: Leaderboard = {
 benchmark: "kris-bench", url: "https://yongliang-wu.github.io/kris_bench_project_page/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Overall Score'));if(!t)throw new Error('Missing KRIS table');
const keys=['Attribute Perception','Spatial Perception','Temporal Perception','Factual Knowledge','Social Science','Natural Science','Conceptual Knowledge','Logical Reasoning','Instruction Decomposition','Procedural Knowledge'];
const rows:LeaderboardRow[]=[];for(const r of t.slice(2)){if(r.length!==12)continue;let model=text(r[0].html.split(/<p\b/i)[0]);const score=num(r[11].text);if(score===undefined)continue;
 if(model==='GPT-4o')model='GPT-4o image editing [snapshot unspecified]';
 const metrics:Record<string,number>={};keys.forEach((key,i)=>{const v=num(r[i+1].text);if(v!==undefined)metrics[key]=v;});rows.push({model,score,metrics});}return rows;
 },
};
export default board;
