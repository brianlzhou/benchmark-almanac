// LoopArena: use Type III SSR, the official site’s default selected leaderboard view.
// Type I decisions and Type II condensed tasks are different evaluations, not model settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import {mdTables} from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/AMAP-ML/LoopArena/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "looparena",
  url: "https://github.com/AMAP-ML/LoopArena",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Type I accuracy'));if(!t)throw new Error('LoopArena table missing');const out:LeaderboardRow[]=[];
    for(const r of t.rows){const score=num(r[t.head.indexOf('Type III SSR')]);if(score!==undefined)out.push({model:identity(r[0]),score,harness:'LoopArena controller',metrics:{type_i:num(r[1])!,type_ii:num(r[2])!}});}return out;
  },
};
export default board;
