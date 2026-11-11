// LongDocURL total accuracy percentage with understanding, reasoning and locating metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/dengc2023/LongDocURL/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "longdocurl",
  url: "https://github.com/dengc2023/LongDocURL",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {"GPT-4o-24-05-13": "gpt-4o-may-2024", "LLaVA-OneVision-Chat-7B": "llava-onevision-7b"},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!(t.head[0] === 'Model' && t.head.at(-1) === 'Total')) continue;
      for (const r of t.rows) {
        const name = r[0]?.replace(/[*†‡🏅🥇🥈🥉]/gu, '').trim();
        const score = num(r[5]);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < t.head.length; i++) {
          if (i === (0) || i === (5)) continue;
          const value = num(r[i]);
          if (value !== undefined) metrics[t.head[i]] = value;
        }
        out.push({ model: identity(r[1] && r[1] !== '-' ? `${name}-${r[1]}` : name), score: score * 1, setting: undefined, metrics });
      }
    }
    if (!out.length) throw new Error("longdocurl: no score rows in the expected tables");
    return out;
  },
};
export default board;
