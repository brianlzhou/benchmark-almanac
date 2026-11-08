// AetherCode: published whole-benchmark pass@1 percentage is the headline score.
// Pass@2, pass@4, years and difficulties remain metrics. Only explicit effort is a setting.
// Undated API snapshots are explicitly unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://huggingface.co/datasets/m-a-p/AetherCode/resolve/main/README.md";
const board: Leaderboard = {
 benchmark: "aethercode", url: "https://huggingface.co/datasets/m-a-p/AetherCode/resolve/main/README.md", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'DeepSeek-R1-0528':'deepseek-r1-may-2025','DeepSeek-V3-0324':'deepseek-v3-mar-2025'},
 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Pass@1'));if(!t)throw new Error('Evaluation table missing');const rows:LeaderboardRow[]=[];let group='';
for(const r of t.rows){if(/Reasoning Models/i.test(r[0])){group=r[0];continue;}if(num(r[7])===undefined)continue;let model=r[0];let effort=model.match(/-(high|medium|low)$/)?.[1];if(effort)model=model.replace(/-(high|medium|low)$/,'');if(/^(GPT-4o|Gemini-2\.5-(Pro|Flash))$/i.test(model))model+=' [snapshot unspecified]';const metrics:Record<string,number>={};for(let i=1;i<7;i++){const v=num(r[i]);if(v!==undefined)metrics[t.head[i]]=v;}for(let i=8;i<10;i++){const value=num(r[i]);if(value!==undefined)metrics[t.head[i].toLowerCase()]=value;}rows.push({model,score:num(r[7])!,setting:effort,metrics});}
return rows;
 },
};
export default board;
