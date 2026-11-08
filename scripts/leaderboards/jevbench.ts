// JevBench current capability score (mean Intelligence and Calibration, 0–100). Preserve ranking eligibility and release settings; convert USD per 1,000 decisions to per decision.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://benchmarkheaven.com/api/jevbench/latest";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "jevbench",
  url: "https://benchmarkheaven.com/jev-models",
  feed: FEED,
  terms: "Public results published by the benchmark authors at benchmarkheaven.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const data = await fetchJson<{revision: string; systems: any[]}>(FEED);
    const out: LeaderboardRow[] = [];
    for (const r of data.systems) {
      if (typeof r.capability?.score !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(r.axes ?? {})) if (typeof v === 'number') metrics[k] = v;
      if (typeof r.latency?.p50_s_measured === 'number') metrics.latency = r.latency.p50_s_measured;
      if (typeof r.composite_score === 'number') metrics.composite = r.composite_score;
      const price = r.price?.usd_per_1000_decisions;
      out.push({model: identity(r.name), score: r.capability.score, setting: [data.revision, r.board, r.capability.eligible ? 'capability ranked' : 'outside capability caps', r.listing, r.price?.kind].filter(Boolean).join('; '), cost: typeof price === 'number' ? price / 1000 : undefined, metrics});
    }
    if (!out.length) throw new Error('JevBench current capability results missing');
    return out;
  },
};
export default board;
