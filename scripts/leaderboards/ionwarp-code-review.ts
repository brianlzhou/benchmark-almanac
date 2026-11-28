// IonWarp AI Code Review Benchmark (Winding Labs): pinned Martian Core 50-PR reproduction (158 known issues).
// Reads CC BY 4.0 OpenAPI JSON endpoint at https://ionwarp.com/benchmarks/v1/reviewers/ionwarp-code-review/metrics.
// Live page draws "Code Review: F1 against cost per review for 9 reviewers" scatter chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://ionwarp.com/benchmarks';
const FEED = 'https://ionwarp.com/benchmarks/v1/reviewers/ionwarp-code-review/metrics';

interface IonWarpRow {
  id: string;
  name: string;
  kind: string;
  model: string | null;
  model_label: string | null;
  effort: string | null;
  composite: number;
  composite_parts?: { f1?: number; latency?: number; cost?: number };
  f1?: number;
  f2?: number;
  precision?: number;
  recall?: number;
  tp?: number;
  fp?: number;
  fn?: number;
  latency_p50_seconds?: number;
  latency_p90_seconds?: number;
  cost_per_review_usd?: number;
  run_dates?: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

const board: Leaderboard = {
  benchmark: 'ionwarp-code-review',
  url: PAGE,
  feed: FEED,
  terms: 'Public CC BY 4.0 OpenAPI JSON endpoint published by Winding Labs at ionwarp.com/benchmarks (robots.txt Allow: /).',
  harnesses: 'system',
  chart: {
    title: 'F1 against cost per review',
    x: { key: 'cost', label: 'Cost per review', unit: '$', better: 'lower', log: true },
    y: { key: 'f1', label: 'F1 score', unit: '%', better: 'higher' },
    note: 'Review F1 accuracy across 50 pull requests against US dollar cost per review for all 9 reviewers.',
  },
  stats: {
    f1: { name: 'F1', unit: '%', better: 'higher' },
    f2: { name: 'F2', unit: '%', better: 'higher' },
    precision: { name: 'Precision', unit: '%', better: 'higher' },
    recall: { name: 'Recall', unit: '%', better: 'higher' },
    tp: { name: 'True positives', unit: 'count', better: 'higher' },
    fp: { name: 'False positives', unit: 'count', better: 'lower' },
    fn: { name: 'False negatives', unit: 'count', better: 'lower' },
    latencyP50: { name: 'Median latency (p50)', unit: 'seconds', better: 'lower' },
    latencyP90: { name: 'Tail latency (p90)', unit: 'seconds', better: 'lower' },
    scoreF1: { name: 'F1 component score', unit: 'score', better: 'higher' },
    scoreLatency: { name: 'Latency component score', unit: 'score', better: 'higher' },
    scoreCost: { name: 'Cost component score', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`IonWarp metrics API: ${res.status}`);
    const data = (await res.json()) as { rows: IonWarpRow[] };

    const rows: LeaderboardRow[] = [];
    for (const r of data.rows ?? []) {
      if (typeof r.composite !== 'number' || !Number.isFinite(r.composite)) continue;
      const isIonWarp = r.kind === 'ionwarp';
      const model = isIonWarp ? (r.model || r.model_label || r.name) : r.name;
      if (!model) continue;

      const metrics: Record<string, number> = {};
      if (typeof r.f1 === 'number') metrics.f1 = r2(r.f1 * 100);
      if (typeof r.f2 === 'number') metrics.f2 = r2(r.f2 * 100);
      if (typeof r.precision === 'number') metrics.precision = r2(r.precision * 100);
      if (typeof r.recall === 'number') metrics.recall = r2(r.recall * 100);
      if (typeof r.tp === 'number') metrics.tp = r.tp;
      if (typeof r.fp === 'number') metrics.fp = r.fp;
      if (typeof r.fn === 'number') metrics.fn = r.fn;
      if (typeof r.latency_p50_seconds === 'number') metrics.latencyP50 = r2(r.latency_p50_seconds);
      if (typeof r.latency_p90_seconds === 'number') metrics.latencyP90 = r2(r.latency_p90_seconds);
      if (typeof r.composite_parts?.f1 === 'number') metrics.scoreF1 = r.composite_parts.f1;
      if (typeof r.composite_parts?.latency === 'number') metrics.scoreLatency = r.composite_parts.latency;
      if (typeof r.composite_parts?.cost === 'number') metrics.scoreCost = r.composite_parts.cost;

      const row: LeaderboardRow = {
        model,
        score: r2(r.composite),
        metrics,
      };
      if (isIonWarp) row.harness = 'IonWarp';
      if (r.effort) row.setting = r.effort;
      if (typeof r.cost_per_review_usd === 'number') row.cost = r4(r.cost_per_review_usd);
      const lastDate = r.run_dates?.at(-1);
      if (typeof lastDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lastDate)) row.date = lastDate;
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('IonWarp: parsed zero rows');
    return rows;
  },
};

export default board;
