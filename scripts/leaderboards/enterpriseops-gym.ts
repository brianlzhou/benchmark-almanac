// EnterpriseOps-Gym: use full-benchmark Oracle task success rates only.
// Exclude the public subset. Reasoning effort stays in setting and domain success rates remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/ServiceNow/EnterpriseOps-Gym/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "enterpriseops-gym",
  url: "https://github.com/ServiceNow/EnterpriseOps-Gym",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!(t.head.includes('Hybrid') && t.head.includes('Teams'))) continue;
      for (const r of t.rows) {
        const name = r[0]?.replace(/[*†‡]/g, '').trim();
        const score = num(r[t.head.length - 1]);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < t.head.length; i++) {
          if (i === (0) || i === (t.head.length - 1)) continue;
          const value = num(r[i]);
          if (value !== undefined) metrics[t.head[i]] = value;
        }
        const effort = name.match(/\s*\((High|Low|Think|Inst\.)\)$/i);
        out.push({ model: identity(effort ? name.slice(0, effort.index) : name), score, setting: `Oracle; ${/Public/.test(t.heading) ? 'public split' : 'full benchmark'}${effort ? '; ' + effort[1] : ''}`, metrics });
      }
    }
    if (!out.length) throw new Error("enterpriseops-gym: no score rows in the expected tables");
    return out.filter(r => r.setting!.includes('; full benchmark')).map(r => ({...r,
      setting:r.setting!.replace('; full benchmark','')}));
  },
};
export default board;
