// TurkishMMLU: average accuracy and four subject-group accuracies from the official README.
// Keep base and instruction-tuned variants distinct; undated GPT API names stay unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/ArdaYueksel/TurkishMMLU/main/README.md";
const board: Leaderboard = {
 benchmark: "turkishmmlu", url: "https://github.com/ArdaYueksel/TurkishMMLU", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'Llama-3 70B-IT':'llama-3-70b','Llama-3 8B-IT':'llama-3-8b'},
 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Average')&&t.head.includes('Natural Sciences'));if(!t)throw new Error('TurkishMMLU table missing');const rows:LeaderboardRow[]=[];
for(const r of t.rows){const score=num(r[2]);if(score===undefined)continue;let model=r[0];if(/^GPT /i.test(model))model+=' [snapshot unspecified]';if(/^Llama-[23] \d+B$/.test(model))model+=' [base]';const metrics:Record<string,number>={};for(let i=3;i<r.length;i++){const n=num(r[i]);if(n!==undefined)metrics[t.head[i]]=n;}rows.push({model,score,metrics});}
return rows;
 },
};
export default board;
