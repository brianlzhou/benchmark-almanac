// WebCanvas Mind2Web-Live task-success percentages with completion and USD-efficiency metrics. Efficiency is not a directly reported per-task cost. Keep environment settings separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import {mdTables} from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/iMeanAI/WebCanvas/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "webcanvas",
  url: "https://github.com/iMeanAI/WebCanvas",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {"gpt-3.5-turbo-0125": "gpt-3-5-turbo-jan-2024", "GPT-4o-2024-05-13": "gpt-4o-may-2024"},
  
  async fetch() {
    const source=await fetchText(FEED);const out:LeaderboardRow[]=[];
    const t=tables(source).find(t=>t[0]?.some(c=>c.text==='USD Efficiency Score'));if(!t)throw new Error('WebCanvas leaderboard missing');
    for(const r of t.slice(1)){const score=num(r[2]?.text);if(score!==undefined)out.push({model:identity(r[0].text),score,setting:'Mind2Web-Live leaderboard',metrics:{completion:num(r[1].text)!,usdEfficiencyScore:num(r[3].text)!}});}
    for(const t of mdTables(source)){if(!t.head.includes('IP Region'))continue;for(const r of t.rows){const score=num(r[5]);if(score!==undefined)out.push({model:identity(r[0]),score,setting:`Environment: ${r[1]}; ${r[2]}; ${r[3]}`,metrics:{completion:num(r[4])!,efficiencyScore:num(r[6])!}});}}
    return out;
  },
};
export default board;
