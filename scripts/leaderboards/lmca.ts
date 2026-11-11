// LMCA conceptual argumentation score on the published 0–100 scale. Includes all effort settings and USD per response from the official cost chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { CRI_ALIASES } from './dtbench.ts';
const FEED = "https://conceptualreasoning.ai/data/cri-scores.csv";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "lmca",
  url: "https://conceptualreasoning.ai/lmca",
  feed: FEED,
  terms: "Public results published by the benchmark authors at conceptualreasoning.ai; retain source attribution and follow the upstream terms.",
  aliases: { ...CRI_ALIASES },
  chart: { title: 'LMCA score versus cost', x: {key: 'cost', label: 'Cost per response', unit: '$', better: 'lower', log: true}, y: {key: 'score', label: 'LMCA', unit: '%', better: 'higher'} },
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = num(r.lmca); if (!r.model || score === undefined) continue;
      const cost = num(r.lmca_cost), ci = num(r.lmca_ci);
      const metrics: Record<string, number> = {};
      if (ci !== undefined) { metrics.ciLow = score - ci; metrics.ciHigh = score + ci; }
      if (cost !== undefined) metrics.cost = cost;
      out.push({model: identity(r.base_model || r.model), score, setting: r.effort || undefined, cost, metrics});
    }
    if (!out.length) throw new Error('LMCA score column missing');
    return out;
  },
};
export default board;
