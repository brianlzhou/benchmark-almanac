// AIR-Bench Chat leaderboard: published average judge score and modality scores. Foundation-task percentages use a different unit and are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/OFA-Sys/AIR-Bench/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "air-bench-audio",
  url: "https://github.com/OFA-Sys/AIR-Bench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!(t.head.at(-1) === 'Average' && t.head[1] === 'Categories')) continue;
      for (const r of t.rows) {
        const name = r[1]?.replace(/[*†‡]/g, '').trim();
        const overall = num(r[6]);
        const score = overall ?? num(r[2]);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < t.head.length; i++) {
          if (i === (1) || i === (6)) continue;
          const value = num(r[i]);
          if (value !== undefined) metrics[t.head[i]] = value;
        }
        out.push({ model: identity(name), score: score * 1, setting: overall === undefined ? 'Chat; Speech only' : 'Chat', metrics });
      }
    }
    if (!out.length) throw new Error("air-bench-audio: no score rows in the expected tables");
    return out;
  },
};
export default board;
