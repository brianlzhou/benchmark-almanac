// Read the board's published Avg. Score, which averages four suites. Exclude the fallback three-suite average.
// Reasoning effort and service tier are whole-benchmark configurations. Latency is milliseconds.
// Cost is a per-minute list price, not per-task expenditure, so it remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const FEED = 'https://bench.retellai.com/';
type Suite = { accuracy: number };
type Row = { model: string; reasoning: string; tier: string; avgScore: number | null;
  scores: Record<string, Suite | null>; latencyP50: number | null; costCentsPerMinute: number | null };
const SUITES = ['instruction_following', 'hallucination', 'tool_calling', 'colloquial'];
const board: Leaderboard = {
  benchmark: 'vcx-benchmark', url: FEED, feed: FEED,
  terms: 'Retell terms prohibit scraping its Services; the almanac credits Retell AI and links the public benchmark source.',
  async fetch() {
    const raw = jsonAfter<Row[]>(nextFlight(await fetchText(FEED, {}, 1)), '"rows":');
    const rows: LeaderboardRow[] = [];
    for (const r of raw) {
      if (r.avgScore === null || SUITES.some(k => r.scores[k] === null || r.scores[k] === undefined)) continue;
      if (!Number.isFinite(r.avgScore) || r.avgScore < 0 || r.avgScore > 1) throw new Error('vCX average scale changed');
      const metrics: Record<string, number> = {};
      for (const k of SUITES) {
        const v = r.scores[k]!.accuracy;
        if (!Number.isFinite(v) || v < 0 || v > 1) throw new Error('vCX suite scale changed');
        metrics[k] = v * 100;
      }
      if (r.latencyP50 !== null) metrics.latencyMs = r.latencyP50;
      if (r.costCentsPerMinute !== null) metrics.dollarsPerMinute = r.costCentsPerMinute / 100;
      // Retell writes Claude version before family. Preserve versioned provider names.
      const model = r.model.replace(/^claude-([\d.]+)-(opus|sonnet|haiku)$/, 'Claude $2 $1');
      rows.push({ model, score: r.avgScore * 100, setting: `${r.reasoning}; ${r.tier}`, harness: 'Retell', metrics });
    }
    if (rows.length === 0) throw new Error('vCX complete-suite scores missing');
    return rows;
  },
};
export default board;
