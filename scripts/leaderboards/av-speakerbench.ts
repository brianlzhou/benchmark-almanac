// AV-SpeakerBench: overall audio-visual speaker understanding accuracy in percent from the official leaderboard. Human performance is excluded. Task categories remain metrics and thinking configurations remain separate settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://plnguyen2908.github.io/AV-SpeakerBench-project-page/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "av-speakerbench",
  url: "https://plnguyen2908.github.io/AV-SpeakerBench-project-page/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at plnguyen2908.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      if (!(head.includes('Speaker Det.'))) continue;
      for (const r of t.slice(1)) {
        const name = (r[0]?.text)?.replace(/[🏅🥇🥈🥉†‡*]/gu, '').trim();
        const score = num(r[2]?.text);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 3; i < Math.min(head.length, r.length); i++) {
          if (i === 0 || i === 2) continue;
          const v = num(r[i]?.text); if (v !== undefined) metrics[head[i]] = v;
        }
        const effort = name.match(/\s*\((Thinking|Non-Thinking)\)$/i);
        out.push({ model: identity(effort ? name.slice(0, effort.index) : name), score, setting: effort?.[1], metrics });
      }
    }
    if (!out.length) throw new Error("av-speakerbench: expected score table missing");
    return out;
  },
};
export default board;
