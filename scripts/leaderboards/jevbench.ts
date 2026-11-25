// JevBench current capability score (mean Intelligence and Calibration, 0–100). Preserve ranking eligibility and release settings; convert USD per 1,000 decisions to per decision.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://benchmarkheaven.com/api/jevbench/latest";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "jevbench",
  stats: {
    speed: { name: 'Speed', unit: 'score', better: 'higher' },
    costScore: { name: 'Cost axis score', unit: 'score', better: 'higher' },
    latency: { name: 'Latency per decision', unit: 'seconds', better: 'lower' },
    composite: { name: 'Composite score', unit: 'score', better: 'higher' },
    'latency:p50_s_raw': { name: 'Raw median latency', unit: 'seconds', better: 'lower' },
    'latency:p50_s_measured': { name: 'Measured median latency', unit: 'seconds', better: 'lower' },
    'latency:p50_s_adjusted': { name: 'Adjusted median latency', unit: 'seconds', better: 'lower', note: 'Includes self-hosted network adjustment (2 times measured p50 plus 150 ms).' },
    'latency:p95_s_raw': { name: 'Raw p95 latency', unit: 'seconds', better: 'lower' },
    'latency:p95_s_adjusted': { name: 'Adjusted p95 latency', unit: 'seconds', better: 'lower' },
    'decision_limit:n_over_limit': { name: 'Decisions over latency limit', unit: 'count', better: 'lower' },
    'decision_limit:n_over_limit_answered_ok': { name: 'Correct decisions over latency limit', unit: 'count' },
  },
  parts: { intelligence: 'Intelligence', calibration: 'Calibration' },
  url: "https://benchmarkheaven.com/jev-models",
  feed: FEED,
  terms: "Public results published by the benchmark authors at benchmarkheaven.com; retain source attribution and follow the upstream terms.",
  aliases: { 'Jev 1.14.0 (TypeSafe AI)': 'jev-1-14-0' },
  
  async fetch() {
    const data = await fetchJson<{revision: string; systems: any[]}>(FEED);
    const out: LeaderboardRow[] = [];
    for (const r of data.systems) {
      if (typeof r.capability?.score !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(r.axes ?? {})) if (typeof v === 'number') metrics[k === 'cost' ? 'costScore' : k] = v;
      if (typeof r.latency?.p50_s_measured === 'number') metrics.latency = r.latency.p50_s_measured;
      if (typeof r.composite_score === 'number') metrics.composite = r.composite_score;
      for (const group of ['latency', 'decision_limit'] as const) {
        for (const [key, value] of Object.entries(r[group] ?? {})) {
          if (group === 'decision_limit' && (key === 'limit_s' || key === 'speed_n')) continue;
          if (group === 'latency' && key === 'n') continue;
          if (typeof value === 'number') metrics[group + ':' + key] = value;
        }
      }
      const price = r.price?.usd_per_1000_decisions;
      out.push({model: identity(r.name), score: r.capability.score,
        date: /^\d{4}-\d{2}-\d{2}$/.test(r.draw?.measured_on ?? '') ? r.draw.measured_on : undefined,
        setting: [data.revision, r.board, r.capability.eligible ? 'capability ranked' : 'outside capability caps', r.listing, r.price?.kind].filter(Boolean).join('; '), cost: typeof price === 'number' ? price / 1000 : undefined, metrics});
    }
    if (!out.length) throw new Error('JevBench current capability results missing');
    return out;
  },
};
export default board;
