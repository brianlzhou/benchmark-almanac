// WebSRC exact-match percentages with F1 and POS metrics. Model names exclude affiliation and citation markup; seed averaging remains explicit.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://x-lance.github.io/WebSRC/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "websrc",
  url: "https://x-lance.github.io/WebSRC/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at x-lance.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=tables((await fetchText(FEED)).replace(/<!--[\s\S]*?-->/g,'')).find(t=>t[0]?.some(c=>c.text==='EM'));if(!t)throw new Error('WebSRC table missing');
    return t.slice(1).flatMap(r=>{const score=num(r[2]?.text);if(score===undefined)return [];const metrics:Record<string,number>={};for(const [k,i] of [['F1',3],['POS',4]] as const){const n=num(r[i]?.text);if(n!==undefined)metrics[k]=n;}const label=text(r[1].html.split(/<p\b/i)[0]);return [{model:label.replace(/[- ]?\(?3_seeds_ave\)?/,''),score,setting:/3_seeds_ave/.test(label)?'3-seed average':undefined,metrics}];});
  },
};
export default board;
