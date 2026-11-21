// AetherCode: published whole-benchmark pass@1 percentage is the headline score.
// Pass@2, pass@4, years and difficulties remain metrics. Read the published reasoning group when a model name omits effort.
// Undated API snapshots are explicitly unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://huggingface.co/datasets/m-a-p/AetherCode/resolve/main/README.md";
const board: Leaderboard = {
 benchmark: "aethercode", url: "https://huggingface.co/datasets/m-a-p/AetherCode/resolve/main/README.md", feed: FEED,
 parts: {
   '2024': { name: '2024', group: 'Split' },
   '2025': { name: '2025', group: 'Split' },
   Easy: { name: 'Easy', group: 'Difficulty' },
   Medium: { name: 'Medium', group: 'Difficulty' },
   Hard: { name: 'Hard', group: 'Difficulty' },
   Extreme: { name: 'Extreme', group: 'Difficulty' },
 },
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 stats: {
   passAt2: { name: 'pass@2', unit: '%', better: 'higher' },
   passAt4: { name: 'pass@4', unit: '%', better: 'higher' },
 },
aliases:{'DeepSeek-R1-0528':'deepseek-r1-may-2025','DeepSeek-V3-0324':'deepseek-v3-mar-2025'},
 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Pass@1'));if(!t)throw new Error('Evaluation table missing');const rows:LeaderboardRow[]=[];let group='';
for(const r of t.rows){if(/Reasoning Models/i.test(r[0])){group=/non-reasoning/i.test(r[0]) ? "Non-reasoning" : "Reasoning";continue;}if(num(r[7])===undefined)continue;let model=r[0];let effort=model.match(/-(high|medium|low)$/)?.[1];if(effort)model=model.replace(/-(high|medium|low)$/,'');if(/^(GPT-4o|Gemini-2\.5-(Pro|Flash))$/i.test(model))model+=' [snapshot unspecified]';const metrics:Record<string,number>={};for(let i=1;i<7;i++){const v=num(r[i]);if(v!==undefined)metrics[t.head[i]]=v;}for(let i=8;i<10;i++){const value=num(r[i]);if(value!==undefined)metrics[t.head[i].toLowerCase().replace("@","At")]=value;}rows.push({model,score:num(r[7])!,setting:effort || group || undefined,metrics});}
return rows;
 },
};
export default board;
