// SORRY-Bench unsafe compliance rates: mean over the 44 published categories, matching the heatmap average. Convert fractions to percentages; lower is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://sorry-bench.github.io/sorry_bench_files/heatmap.js";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "sorry-bench",
  url: "https://sorry-bench.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at sorry-bench.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const source = await fetchText(FEED);
    const clean = source.replace(/^\s*\/\/.*$/gm, '');
    const categories = jsonAfter<string[]>(clean.replace(/,\s*\]/g, ']'), 'const all_categories =');
    const out: LeaderboardRow[] = [];
    for (const m of clean.matchAll(/model:\s*"([^"]+)"\s*,\s*scores:\s*(\[[\d.,\s]+\])/g)) {
      const scores = JSON.parse(m[2]) as number[];
      if (scores.length !== categories.length) throw new Error(`SORRY-Bench category mismatch: ${m[1]}`);
      const metrics = Object.fromEntries(scores.map((score, i) => [categories[i], score * 100]));
      out.push({model: identity(m[1]), score: 100 * scores.reduce((a,b) => a+b,0) / scores.length, metrics});
    }
    if (!out.length) throw new Error('SORRY-Bench heatmap data missing');
    return out;
  },
};
export default board;
