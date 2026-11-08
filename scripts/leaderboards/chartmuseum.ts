// ChartMuseum: overall chart-question accuracy in percent from the official HTML leaderboard. Visual, synthesis, mixed visual/text, and text reasoning categories remain separate metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://chartmuseum-leaderboard.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "chartmuseum",
  url: "https://chartmuseum-leaderboard.github.io",
  feed: FEED,
  terms: "Public results published by the benchmark authors at chartmuseum-leaderboard.github.io; retain source attribution and follow the upstream terms.",
  aliases: {"Gemma-4-31B-Instruct": "gemma-4-31b-it", "Gemma-4-26B-A4B-Instruct": "gemma-4-26b-a4b", "Claude-4.5-Opus": "claude-opus-4-5", "Claude-4.1-Opus": "claude-opus-4-1", "Claude-4-Sonnet": "claude-sonnet-4"},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      if (!(head.includes('Visual') && head.includes('Overall'))) continue;
      for (const r of t.slice(1)) {
        const name = (r[0]?.text)?.replace(/[🏅🥇🥈🥉†‡*]/gu, '').trim();
        const score = num(r[6]?.text);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 2; i < Math.min(head.length, r.length); i++) {
          if (i === 0 || i === 6) continue;
          const v = num(r[i]?.text); if (v !== undefined) metrics[head[i]] = v;
        }
        const effort = name.match(/\s*\((high|medium|low|xhigh|max)\)$/i);
        out.push({ model: identity(effort ? name.slice(0, effort.index) : name), score, setting: effort?.[1], metrics });
      }
    }
    if (!out.length) throw new Error("chartmuseum: expected score table missing");
    return out;
  },
};
export default board;
