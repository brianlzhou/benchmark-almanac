// PrivacyLens: whole-set leakage rate LR is the score, lower is better.
// Prompts apply to the whole set. Probing accuracy, helpfulness and conditional LR remain metrics.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2409.00138";
const board: Leaderboard = {
 benchmark: "privacylens",
 url: "https://arxiv.org/html/2409.00138",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(grid).find(t=>t[0]?.[1]==='Basic Prompt');if(!t)throw new Error('PrivacyLens table missing');const rows:LeaderboardRow[]=[];
 for(const r of t.slice(4))for(const i of [1,5])rows.push({model:r[0]==='ChatGPT-3.5'?'GPT-3.5 Turbo (snapshot unspecified)':r[0],score:num(r[i+1])!,setting:i===1?'Basic Prompt':'Privacy-Enhancing Prompt',metrics:{probing:num(r[i])!,conditionalLeakage:num(r[i+2])!,helpfulness:num(r[i+3])!}});
 return checked(rows,18);
 },
};
export default board;
