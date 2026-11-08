// SimuVerity overall score for each agent system. Delivery, executable, and grader-pass percentages remain metrics; the named agent is the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://simuverity.github.io/SimuVerity/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "simuverity",
  url: "https://simuverity.github.io/SimuVerity/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at simuverity.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='G pass'));if(!t)throw new Error('SimuVerity table missing');
    return t.slice(1).flatMap(r=>{const score=num(r[2]?.text);if(score===undefined)return [];const [model,...harness]=r[1].text.split(' + ');return [{model:identity(model),harness:harness.join(' + ')||undefined,score,metrics:{delivered:num(r[3].text)!,executable:num(r[4].text)!,graderPass:num(r[5].text)!}}];});
  },
};
export default board;
