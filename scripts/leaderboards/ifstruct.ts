// IFStruct v1.0: the official announcement’s IFStruct column is the instruction/structure success percentage. The neighboring StructEval and Structured Output Benchmark figures are retained only as separately named metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://www.liquid.ai/blog/ifstruct-v1.0";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "ifstruct",
  url: "https://www.liquid.ai/blog/ifstruct-v1.0",
  feed: FEED,
  terms: "Public results published by the benchmark authors at www.liquid.ai; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      if (!(head.includes('IFStruct'))) continue;
      for (const r of t.slice(1)) {
        const name = (r[0]?.text)?.replace(/[🏅🥇🥈🥉†‡*]/gu, '').trim();
        const score = num(r[1]?.text);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 2; i < Math.min(head.length, r.length); i++) {
          if (i === 0 || i === 1) continue;
          const v = num(r[i]?.text); if (v !== undefined) metrics[head[i]] = v;
        }
        out.push({ model: identity(name), score: score * 1, setting: undefined, metrics });
      }
    }
    if (!out.length) throw new Error("ifstruct: expected score table missing");
    return out;
  },
};
export default board;
