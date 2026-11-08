// RoboWorld mean test reward is the score. Test, easier-subset, and embodiment success percentages remain separately named metrics; reasoning effort is a setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://gym-anything.github.io/robotics/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "roboworld",
  url: "https://gym-anything.github.io/robotics/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at gym-anything.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Test Reward'));if(!t)throw new Error('RoboWorld table missing');const h=t[0].map(c=>c.text);
    return t.slice(1).flatMap(r=>{const score=num(r[2]?.text);if(score===undefined)return [];const metrics:Record<string,number>={};for(let i=3;i<h.length;i++){const v=num(r[i]?.text);if(v!==undefined)metrics[(i>=5?'Easier subset ':'')+h[i]]=v;}const effort=r[1].text.match(/\(([^)]+)\)$/)?.[1];return [{model:identity(r[1].text.replace(/\s*\([^)]+\)$/,'')),score,setting:'Test reward; '+(effort??'effort unspecified'),metrics}];});
  },
};
export default board;
