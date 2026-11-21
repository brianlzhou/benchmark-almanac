// olmOCR-Bench overall percentage and OCR category breakdowns, including the lower and upper endpoints of the published interval. Blank separator excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/allenai/olmocr/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "olmocr-bench",
  parts: {
    ArXiv: { name: 'arXiv', group: 'Category' },
    'Old scans math': { name: 'Old scans math', group: 'Category' },
    Tables: { name: 'Tables', group: 'Category' },
    'Old scans': { name: 'Old scans', group: 'Category' },
    'Headers & footers': { name: 'Headers and footers', group: 'Category' },
    'Multi column': { name: 'Multi column', group: 'Category' },
    'Long tiny text': { name: 'Long tiny text', group: 'Category' },
    Base: { name: 'Base', group: 'Category' },
  },
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
        const ci = r[9]?.text.match(/±\s*([\d.]+)/); const width = ci ? Number(ci[1]) : undefined;
        out.push({ model: identity(name), score, low: width === undefined ? undefined : score - width, high: width === undefined ? undefined : score + width, metrics });
      }
    }
    if (!out.length) throw new Error("olmocr-bench: expected score table missing");
    return out;
  },
};
export default board;
