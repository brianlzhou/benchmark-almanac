// SEED-Bench v2 has no full-suite aggregate. Use the official app.py default ranking,
// "Avg. Single" (sort_values at startup). Other published group averages are metrics.
// The first 16 task dimensions contribute to Avg. Single. The app fills unattempted later levels with zeros.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/AILab-CVC/SEED-Bench_Leaderboard/resolve/main/file/result_v2.csv";
const board: Leaderboard = {
 benchmark: "seed-bench-2", url: "https://huggingface.co/spaces/AILab-CVC/SEED-Bench_Leaderboard", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
 const parts: NonNullable<Leaderboard['parts']> = {};
const data=parseCsv(await fetchText(FEED));const rows:LeaderboardRow[]=[];const seen=new Set<string>();
for(const r of data){const key=JSON.stringify(r);if(seen.has(key))continue;seen.add(key);
 let model=r.Model?.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').trim();if(!model)continue;
 if(/^(GPT-4|Gemini)/i.test(model)&&! /20\d\d/.test(model))model+=' [snapshot unspecified]';
 const metrics:Record<string,number>={};for(const [k,v]of Object.entries(r)){if(!v.trim()||['Model','Language Model','Model Size','Evaluation Method'].includes(k))continue;const n=Number(v);if(Number.isFinite(n))metrics[k]=n;}
 const score = metrics['Avg. Single'];
 if (score === undefined) continue;
 const dimensions = Object.keys(r).slice(Object.keys(r).indexOf('Scene Understanding'));
 const scores = Object.fromEntries(Object.entries(metrics).filter(([key]) => key.startsWith('Avg.')));
 for (const [index, name] of dimensions.entries()) {
   const value = metrics[name];
   if (value === undefined) continue;
   const group = index < 16 ? 'Single' : index < 22 ? 'P1' : index < 24 ? 'P2' : 'P3';
   if (index >= 16 && !metrics['Avg. ' + group] && !value) continue;
   const key = name.toLowerCase().replace(/[^a-z0-9]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '');
   scores[key] = value;
   if (index < 16) parts[key] = {name, group: 'Single image'};
 }
 const size = r['Model Size']?.match(/^([\d.]+)B$/i);
 rows.push({model, score, setting:r['Evaluation Method'], params:size ? Number(size[1]) : undefined, metrics:scores});
 }
 board.parts = parts;
return rows;
 },
};
export default board;
