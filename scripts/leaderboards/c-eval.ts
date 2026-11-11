// C-Eval: the official README reports average accuracy in percent for zero-shot and five-shot evaluation. Keep both settings and the four subject-group accuracies. The Hard and validation boards are separate and are not mixed into the test score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/hkust-nlp/ceval/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "c-eval",
  url: "https://github.com/hkust-nlp/ceval",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {"Claude-v1.3": "claude-1-3"},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!(t.head.includes('Average') && /^(Zero|Five)-shot$/i.test(t.heading))) continue;
      for (const r of t.rows) {
        const name = r[0]?.replace(/[*†‡]/g, '').trim();
        const score = num(r[t.head.indexOf('Average')]);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < t.head.length; i++) {
          if (i === (0) || i === (t.head.indexOf('Average'))) continue;
          const value = num(r[i]);
          if (value !== undefined) metrics[t.head[i]] = value;
        }
        out.push({ model: identity(name), score: score * 1, setting: t.heading, metrics });
      }
    }
    if (!out.length) throw new Error("c-eval: no score rows in the expected tables");
    return out;
  },
};
export default board;
