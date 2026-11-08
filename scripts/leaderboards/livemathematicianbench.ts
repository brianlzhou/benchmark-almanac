// LiveMathematicianBench: use published_overall.accuracy, the default full-window accuracy.
// Monthly scores are metrics. Do not synthesize an aggregate when the published overall is missing.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://livemathematicianbench.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "livemathematicianbench",
  url: "https://livemathematicianbench.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at livemathematicianbench.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    type Result = {correct: number; total: number; accuracy: number};
    type Row = {model: string; month: string; reasoning_effort?: string; overall: Result; published_overall?: Result; avg_completion_tokens?: number; avg_elapsed_seconds?: number};
    const data = jsonAfter<Row[]>(await fetchText(FEED), 'const ACCURACY = ');
    const out: LeaderboardRow[] = [];
    const groups = new Map<string, {row: Row; official?: Result; metrics: Record<string, number>}>();
    for (const r of data) {
      if (!r.model || !r.overall?.total) continue;
      const key = `${r.model}|${r.reasoning_effort}`;
      const g = groups.get(key) ?? {row:r, metrics:{}};
      g.metrics[`month_${r.month}`] = 100 * r.overall.accuracy;
      if (r.published_overall) g.official = r.published_overall;
      groups.set(key, g);
    }
    for (const g of groups.values()) {
      if (!g.official || !Number.isFinite(g.official.accuracy)) continue;
      out.push({model:identity(g.row.model), score:100*g.official.accuracy,
        setting:g.row.reasoning_effort ?? 'default',
        metrics:{correct:g.official.correct,total:g.official.total,...Object.fromEntries(Object.entries(g.metrics).slice(-22))}});
    }
    if (!out.length) throw new Error('LiveMathematicianBench accuracy data missing');
    return out;
  },
};
export default board;
