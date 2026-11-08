// SEED-Bench v2 has no full-suite aggregate. Use the official app.py default ranking,
// "Avg. Single" (sort_values at startup). Other published group averages are metrics.
// Evaluation method is the configuration; no aggregate is invented.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/AILab-CVC/SEED-Bench_Leaderboard/resolve/main/file/result_v2.csv";
const board: Leaderboard = {
 benchmark: "seed-bench-2", url: "https://huggingface.co/spaces/AILab-CVC/SEED-Bench_Leaderboard", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const data=parseCsv(await fetchText(FEED));const rows:LeaderboardRow[]=[];const seen=new Set<string>();
for(const r of data){const key=JSON.stringify(r);if(seen.has(key))continue;seen.add(key);
 let model=r.Model?.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').trim();if(!model)continue;
 if(/^(GPT-4|Gemini)/i.test(model)&&! /20\d\d/.test(model))model+=' [snapshot unspecified]';
 const metrics:Record<string,number>={};for(const [k,v]of Object.entries(r)){if(!v.trim()||['Model','Language Model','Model Size','Evaluation Method'].includes(k))continue;const n=Number(v);if(Number.isFinite(n))metrics[k]=n;}
 for(const col of ['Avg. Single']){const score=metrics[col];if(score===undefined)continue;rows.push({model,score,setting:r['Evaluation Method'],metrics:Object.fromEntries(Object.entries(metrics).filter(([key])=>key.startsWith('Avg.')))});}}
return rows;
 },
};
export default board;
