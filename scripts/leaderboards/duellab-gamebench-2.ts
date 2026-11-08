// DuelLab GameBench 2 standings score with separate ranked and pending settings. Cost per generated player is retained as its own metric, not cost per game.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://benchmarks.duellab.org/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "duellab-gamebench-2",
  url: "https://benchmarks.duellab.org/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at benchmarks.duellab.org; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      const mi = head.indexOf('Model'), si = head.indexOf('Score') >= 0 ? head.indexOf('Score') : head.indexOf('Score so far');
      if (mi < 0 || si < 0) continue;
      for (const r of t.slice(1)) {
        const score = num(r[si]?.text); if (score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (const [key, label] of [['costPerPlayer','Cost / player'],['strength','Strength'],['best','Best']]) { const v = num(r[head.indexOf(label)]?.text); if (v !== undefined) metrics[key] = v; }
        out.push({model: identity(r[mi].text), score, setting: [head.includes('Score so far') ? 'pending' : 'ranked', r[head.indexOf('Reasoning')]?.text, r[head.indexOf('Why not ranked')]?.text].filter(Boolean).join('; '), metrics});
      }
    }
    if (!out.length) throw new Error('DuelLab standings missing');
    return out;
  },
};
export default board;
