// LABBench2 FigQA2 average correctness, converted from fractions to percentages. Keep tool/reasoning variants and modes; tokens and durations are published averages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://advances.edisonscientific.com/benchmarks/labbench2/figqa2/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "labbench2-figqa2",
  url: "https://advances.edisonscientific.com/benchmarks/labbench2/figqa2/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at advances.edisonscientific.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text.includes('Average score')));if(!t)throw new Error('FigQA2 table missing');
    return t.slice(1).flatMap(r=>{const score=num(r[4]?.text);if(score===undefined)return [];const token=num(r[5]?.text);const duration=num(r[6]?.text);return [{model:identity(r[1].text),score:score*100,setting:r[2].text+'; mode '+r[3].text,date:r[7]?.text,tokens:token===undefined?undefined:token*(/k/i.test(r[5].text)?1000:1),metrics:duration===undefined?undefined:{latency:duration*(/m/i.test(r[6].text)?60:1)}}];});
  },
};
export default board;
