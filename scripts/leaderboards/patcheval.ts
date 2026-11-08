// PatchEval-Verified: the README reports Pass@1 as passed/total followed by a percentage. Read the parenthesized percentage, not the numerator, and retain the task counts. Agent names are harnesses and model names remain separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/bytedance/PatchEval/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "patcheval",
  url: "https://github.com/bytedance/PatchEval",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find(t => t.head.join('|') === 'Agent|Model|Pass@1');
    if (!t) throw new Error('PatchEval result table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const m = r[2]?.match(/(\d+)\s*\/\s*(\d+)\s*\(([\d.]+)%\)/);
      if (!r[1] || !m) continue;
      rows.push({ model: identity(r[1]), harness: r[0], score: Number(m[3]), setting: 'PatchEval-Verified', metrics: { passed: Number(m[1]), tasks: Number(m[2]) } });
    }
    if (!rows.length) throw new Error('PatchEval percentage rows missing');
    return rows;
  },
};
export default board;
