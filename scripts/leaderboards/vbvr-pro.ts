// The current official results table evaluates the Pro release. Original VBVR results must remain separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://video-reason.com/?v=pro";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "vbvr-pro",
  url: "https://video-reason.com/?v=pro",
  feed: FEED,
  terms: "Public results published by the benchmark authors at video-reason.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      if (!(head.includes('In-Domain') && head.includes('Out-of-Domain'))) continue;
      for (const r of t.slice(1)) {
        const name = (r[1]?.text)?.replace(/[🏅🥇🥈🥉†‡*]/gu, '').trim();
        const score = num(r[4]?.text);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 4; i < Math.min(head.length, r.length); i++) {
          if (i === 1 || i === 4) continue;
          const v = num(r[i]?.text); if (v !== undefined) metrics[head[i]] = v;
        }
        out.push({ model: identity(name), score: score * 1, setting: `VBVR-Pro; ${r[2]?.text}; ${r[3]?.text}`, metrics });
      }
    }
    if (!out.length) throw new Error("vbvr-bench: expected score table missing");
    return out;
  },
};
export default board;
