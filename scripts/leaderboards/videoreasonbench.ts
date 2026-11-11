// VideoReasonBench: overall video reasoning accuracy in percent from the official table. Retain six reasoning-category accuracies, thinking status, and explicitly reported model sizes; exclude human and section-header rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://llyx97.github.io/video_reason_bench/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "videoreasonbench",
  url: "https://llyx97.github.io/video_reason_bench/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at llyx97.github.io; retain source attribution and follow the upstream terms.",
  aliases: {"Gemini-2.5-Pro-0506": "gemini-2-5-pro-may-2025", "Gemini-2.5-Flash-0417": "gemini-2-5-flash-apr-2025"},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      if (!(head.includes('Predict Operation'))) continue;
      for (const r of t.slice(1)) {
        const name = (/^(Qwen2.5-VL|InternVL3|LLaVA-Video|LLaVA-OneVision)$/.test(r[0]?.text) ? r[0].text + '-' + r[1].text : r[0]?.text)?.replace(/[🏅🥇🥈🥉†‡*]/gu, '').trim();
        const score = num(r[9]?.text);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 3; i < Math.min(head.length, r.length); i++) {
          if (i === 0 || i === 9) continue;
          const v = num(r[i]?.text); if (v !== undefined) metrics[head[i]] = v;
        }
        out.push({ model: identity(name), score: score * 1, setting: r[2]?.text === '✓' ? 'thinking' : 'non-thinking', metrics });
      }
    }
    if (!out.length) throw new Error("videoreasonbench: expected score table missing");
    return out;
  },
};
export default board;
