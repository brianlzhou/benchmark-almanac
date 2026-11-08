// CMMLU: the official README publishes mean accuracy in percent across 67 Chinese subjects. Both zero-shot and five-shot tables are retained, with subject-group accuracies as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/haonan-li/CMMLU/master/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "cmmlu",
  url: "https://github.com/haonan-li/CMMLU",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const source = (await fetchText(FEED)).replace(/<summary>(.*?)<\/summary>/g, '\n### $1\n');
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(source)) {
      if (!t.head.includes('平均分')) continue;
      for (const r of t.rows) {
        const score = num(r[6]);
        if (!r[0] || /random|随机/i.test(r[0]) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        t.head.slice(1, 6).forEach((h, i) => { const v = num(r[i + 1]); if (v !== undefined) metrics[h] = v; });
        out.push({ model: identity(r[0]), score, setting: t.heading, metrics });
      }
    }
    if (!out.length) throw new Error('CMMLU tables missing');
    return out;
  },
};
export default board;
