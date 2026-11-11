// GAOKAO-Bench: use the first scored leaderboard, objective-question Overall percentage,
// the view normally reported for this registry record. Subjective Overall is secondary.
// Keep subject metrics and dated API model identities. Do not average question types.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/OpenLMLab/GAOKAO-Bench/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "gaokao-bench",
  url: "https://github.com/OpenLMLab/GAOKAO-Bench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!(t.head.includes('Overall') && t.head.includes('Sci. Math'))) continue;
      for (const r of t.rows) {
        const name = r[0]?.replace(/[*†‡]/g, '').trim();
        const score = num(r[1]);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < t.head.length; i++) {
          if (i === (0) || i === (1)) continue;
          const value = num(r[i]);
          if (value !== undefined) metrics[t.head[i]] = value;
        }
        out.push({ model: identity(name), score: score * 1, setting: t.heading.includes('客观') ? 'objective questions' : 'subjective questions', metrics });
      }
    }
    if (!out.length) throw new Error("gaokao-bench: no score rows in the expected tables");
    const overall = out.filter(r => r.setting === 'objective questions');
    for (const row of overall) {
      const subjective = out.find(r => r.model === row.model && r.setting === 'subjective questions');
      if (subjective) row.metrics!.subjective = subjective.score;
      delete row.setting;
    }
    return overall;
  },
};
export default board;
