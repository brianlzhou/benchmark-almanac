// MMTU publishes accuracy fractions with uncertainty. Scores and uncertainty are converted to percentages.
// The source labels one o4-mini row with a contradictory 2024 date; its exact label remains unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/MMTU-benchmark/MMTU/main/README.md";
const board: Leaderboard = {
 benchmark: "mmtu", url: "https://github.com/MMTU-benchmark/MMTU", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 aliases: {'Mistral-Large-2411':'mistral-large-2-nov-2024','Mistral-Small-2503':'mistral-small-3-1','GPT-4o (2024-11-20)':'gpt-4o-nov-2024','GPT-4o-mini (2024-07-18)':'gpt-4o-mini'},
 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head.some(h=>h.includes('MMTU Score')));if(!t)throw new Error('No MMTU table');return t.rows.flatMap(r=>{const score=num(r[2]);if(score===undefined)return [];let model=r[1].replace(/\*/g,'').trim();if(['Gemini-2.5-Pro','Deepseek-R1','Deepseek-V3'].includes(model))model+=' [snapshot unspecified]';if(model==='o4-mini (2024-11-20)')model+=' [source date inconsistent]';return [{model,score:score*100,setting:r[0],metrics:{uncertaintyPercent:num(r[2].split('±')[1])!*100}}];});
 },
};
export default board;
