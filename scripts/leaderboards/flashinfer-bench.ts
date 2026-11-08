// FlashInfer-Bench average speedup, with resolved-workload percentage and workload count as metrics. Undated API model snapshots remain unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://bench.flashinfer.ai";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "flashinfer-bench",
  url: "https://bench.flashinfer.ai",
  feed: FEED,
  terms: "Public results published by the benchmark authors at bench.flashinfer.ai; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text.startsWith('Avg Speedup')));if(!t)throw new Error('FlashInfer leaderboard missing');
    return t.slice(1).flatMap(r=>{const score=num(r[1]?.text);if(score===undefined)return [];const count=r[2].text.match(/\(\s*([\d,]+)\s*workloads/);return [{model:identity(r[0].text.replace(/^\d+\s*\.\s*/,'')),score,metrics:{resolvedPercent:num(r[2].text)!,...(count?{workloads:Number(count[1].replace(/,/g,''))}:{})}}];});
  },
};
export default board;
