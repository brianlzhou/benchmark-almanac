// LLMBoxing archived vote totals, preserving the two independent head-to-head contests.
// Archive date identifies the snapshot; vote totals are not cross-contest model ratings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://web.archive.org/web/20231225081704/https://llmboxing.com/leaderboard";
const board: Leaderboard = {
 benchmark: "llmboxing", url: "https://web.archive.org/web/2023/https://llmboxing.com/leaderboard", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 aliases:{'Llama 2 70B Chat':'llama-2-70b','Llama 2 13B Chat':'llama-2-13b'},
 async fetch() {
const html=await fetchText(FEED);const rows:LeaderboardRow[]=[];
for(const m of html.matchAll(/<h1[^>]*class="font-bold text-2xl mt-12"[^>]*>([^<]+)<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/g)){
 let model=text(m[1]);const score=num(text(m[2]));if(score===undefined)continue;
 const setting=/70B|GPT/.test(model)?'Llama 2 70B vs GPT-3.5; archive 2023-12-25':'Llama 2 13B vs Mistral 7B; archive 2023-12-25';
 if(model==='GPT 3.5')model+=' [snapshot unspecified]';if(model==='Mistral 7B Instruct')model+=' [snapshot unspecified]';
 rows.push({model,score,setting});}if(rows.length<2)throw new Error('Missing archived vote totals');return rows;
 },
};
export default board;
