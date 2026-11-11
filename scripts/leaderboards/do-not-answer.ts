// Do-Not-Answer: human-rated harmlessness is the published ranking and headline percentage.
// GPT-4 and Longformer evaluate the same responses and remain secondary metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/Libr-AI/do-not-answer/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "do-not-answer",
  url: "https://github.com/Libr-AI/do-not-answer",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (t.head.join('|') !== 'Model|Human|GPT-4|Longformer') continue;
      for (const r of t.rows) {
        const i = 1;
        const score = num(r[i]); if (score === undefined) continue;
        out.push({model: identity(r[0]), score, metrics: Object.fromEntries([['gpt4', num(r[2])], ['longformer', num(r[3])]].filter((p): p is [string, number] => typeof p[1] === 'number'))});
      }
    }
    if (!out.length) throw new Error('Harmlessness table missing');
    return out;
  },
};
export default board;
