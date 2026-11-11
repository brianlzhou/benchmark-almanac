// Daily-Omni: average question accuracy in percent, read from the official README. Visual-plus-audio, visual-only, audio-only, and textual evaluations remain separate settings; task categories and duration buckets remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/Lliar-liar/Daily-Omni/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "daily-omni",
  url: "https://github.com/Lliar-liar/Daily-Omni",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {"NVIDIA Nemotron 3 Nano Omni 30B A3B": "nemotron-3-nano-omni-30b-a3b"},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!(t.head.includes('Avg') && t.head.includes('Methods'))) continue;
      for (const r of t.rows) {
        const name = r[0]?.replace(/\s*\((?:Open|Closed)\)/g, '').replace(/[*†‡]/g, '').trim();
        const score = num(r[t.head.indexOf('Avg')]);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < t.head.length; i++) {
          if (i === (0) || i === (t.head.indexOf('Avg'))) continue;
          const value = num(r[i]);
          if (value !== undefined) metrics[t.head[i]] = value;
        }
        out.push({ model: identity(name), score: score * 1, setting: t.heading, metrics });
      }
    }
    if (!out.length) throw new Error("daily-omni: no score rows in the expected tables");
    return out;
  },
};
export default board;
