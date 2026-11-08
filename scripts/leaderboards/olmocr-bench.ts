// olmOCR-Bench overall percentage and OCR category breakdowns, including confidence interval width as a metric when provided. Blank separator excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/allenai/olmocr/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "olmocr-bench",
  url: "https://github.com/allenai/olmocr",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      if (!(head.includes("Overall"))) continue;
      for (const r of t.slice(1)) {
        const name = (r[0]?.text)?.replace(/[🏅🥇🥈🥉†‡*]/gu, '').trim();
        const score = num(r[9]?.text);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 0; i < Math.min(head.length, r.length); i++) {
          if (i === 0 || i === 9) continue;
          const v = num(r[i]?.text); if (v !== undefined) metrics[head[i]] = v;
        }
        const ci = r[9]?.text.match(/±\s*([\d.]+)/); if (ci) metrics.confidenceHalfWidth = Number(ci[1]);
        out.push({ model: identity(name), score: score * 1, setting: undefined, metrics });
      }
    }
    if (!out.length) throw new Error("olmocr-bench: expected score table missing");
    return out;
  },
};
export default board;
