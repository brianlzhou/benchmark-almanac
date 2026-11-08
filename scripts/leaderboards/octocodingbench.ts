// OctoCodingbench: the MiniMax-M2.1 README publishes a benchmark-by-model comparison table. Transpose only the OctoCodingbench row, retaining reported percentages and the GPT thinking setting; unavailable entries are not zero scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/MiniMax-AI/MiniMax-M2.1/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "octocodingbench",
  url: "https://github.com/MiniMax-AI/MiniMax-M2.1",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      const r = t.rows.find(r => /^OctoCodingbench$/i.test(r[0])); if (!r) continue;
      for (let i = 1; i < t.head.length; i++) {
        const score = num(r[i]); if (score === undefined) continue;
        const name = t.head[i], effort = name.match(/\s*\((thinking)\)$/i);
        rows.push({ model: identity(effort ? name.slice(0, effort.index) : name), score, setting: effort?.[1] });
      }
    }
    if (!rows.length) throw new Error('OctoCodingbench row missing');
    return rows;
  },
};
export default board;
