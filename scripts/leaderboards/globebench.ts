// GlobeBench task-success percentages for the twenty evaluated model systems; pooled cross-model aggregate excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/patronus-ai/globebench/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "globebench",
  url: "https://github.com/patronus-ai/globebench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    const all = mdTables(await fetchText(FEED));
    const serving = all.find(t => t.head.includes('Recorded settings'));
    for (const t of all) {
      if (!(t.head.includes('Task success'))) continue;
      for (const r of t.rows) {
        const name = r[1]?.replace(/[*†‡]/g, '').trim();
        const score = num(r[3]);
        if (!name || /^(?:human|random|oracle|All 20)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < t.head.length; i++) {
          if (i === (1) || i === (3)) continue;
          const value = num(r[i]);
          if (value !== undefined) metrics[t.head[i]] = value;
        }
        out.push({ model: identity(name), score: score * 1, setting: 'Released binary leaderboard; primary settings (retries may vary): ' + (serving?.rows.find(r => r[0].split(',').some(n => name === n.trim() || name === 'Claude ' + n.trim() || name.includes('Digital World Model') && n.trim() === 'DWM'))?.[2] ?? 'see source serving settings'), metrics });
      }
    }
    if (!out.length) throw new Error("globebench: no score rows in the expected tables");
    return out;
  },
};
export default board;
