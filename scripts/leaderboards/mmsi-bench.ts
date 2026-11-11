// MMSI-Bench: overall spatial-intelligence accuracy in percent from the official README. Exclude human and random references, retain the blind model baseline, and distinguish thinking configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/OpenRobotLab/MMSI-Bench/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "mmsi-bench",
  url: "https://github.com/OpenRobotLab/MMSI-Bench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!(t.head.includes('Avg. (%)'))) continue;
      for (const r of t.rows) {
        const name = r[0]?.replace(/^[^A-Za-z0-9]+/, '').replace(/[*†‡]/g, '').trim();
        const score = num(r[1]);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < t.head.length; i++) {
          if (i === (0) || i === (1)) continue;
          const value = num(r[i]);
          if (value !== undefined) metrics[t.head[i]] = value;
        }
        const thinking = /--Thinking$/i.test(name);
        const blind = /^Blind /.test(name);
        out.push({ model: identity(name.replace(/--Thinking$/i, '').replace(/^Blind /, '')), score, setting: thinking ? 'thinking' : blind ? 'blind' : undefined, metrics });
      }
    }
    if (!out.length) throw new Error("mmsi-bench: no score rows in the expected tables");
    return out;
  },
};
export default board;
