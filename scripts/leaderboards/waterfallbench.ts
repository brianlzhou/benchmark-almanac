// WaterfallBench: deterministic SEC asset-backed securitization monthly cash-flow waterfall calculation.
// Source verbatim SE definition (https://ritik-12.github.io/WaterfallBench/):
//   "Leaderboard scores average these over the 20 tasks; ± is one standard error."
// Headline SE is stored under house key `metrics.stderr`. Live page draws a log-scale Pareto frontier chart
// ("Score versus cost per task", default metric fully_resolved).
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://ritik-12.github.io/WaterfallBench/';
const FEED = 'https://ritik-12.github.io/WaterfallBench/data.json';

interface WaterfallModel {
  key: string;
  name: string;
  fully_resolved: number;
  se?: number;
  nontrivial?: number;
  line_item?: number;
  tolerance?: number;
  cost?: number;
  cost_total?: number;
  tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  seconds?: number;
}

interface WaterfallData {
  updated?: string;
  models: WaterfallModel[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

const board: Leaderboard = {
  benchmark: 'waterfallbench',
  url: PAGE,
  feed: FEED,
  terms: 'Public CC BY 4.0 leaderboard JSON published on GitHub Pages.',
  chart: {
    title: 'Fully resolved vs cost',
    x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Fully resolved', unit: '%', better: 'higher' },
    note: 'Share of 20 ABS securitization waterfalls solved to the cent against API cost per task.',
  },
  stats: {
    nontrivial: { name: 'Field accuracy', unit: '%', better: 'higher' },
    lineItem: { name: 'Line-item accuracy', unit: '%', better: 'higher' },
    tolerance: { name: 'Tolerance accuracy', unit: '%', better: 'higher' },
    costTotal: { name: 'Total run cost', unit: 'usd', better: 'lower' },
    inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' },
    totalTokens: { name: 'Total tokens', unit: 'tokens', better: 'lower' },
    seconds: { name: 'Time per task', unit: 'seconds', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`WaterfallBench data.json: ${res.status}`);
    const data = (await res.json()) as WaterfallData;
    const date = typeof data.updated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.updated) ? data.updated : undefined;

    const rows: LeaderboardRow[] = [];
    for (const m of data.models ?? []) {
      if (!m.name || typeof m.fully_resolved !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof m.se === 'number' && Number.isFinite(m.se)) metrics.stderr = r2(m.se);
      if (typeof m.nontrivial === 'number') metrics.nontrivial = r2(m.nontrivial);
      if (typeof m.line_item === 'number') metrics.lineItem = r2(m.line_item);
      if (typeof m.tolerance === 'number') metrics.tolerance = r2(m.tolerance);
      if (typeof m.cost_total === 'number') metrics.costTotal = r2(m.cost_total);
      if (typeof m.input_tokens === 'number') metrics.inputTokens = Math.round(m.input_tokens);
      if (typeof m.tokens === 'number') metrics.totalTokens = Math.round(m.tokens);
      if (typeof m.seconds === 'number') metrics.seconds = r2(m.seconds);

      const row: LeaderboardRow = {
        model: m.name,
        score: r2(m.fully_resolved),
        metrics,
      };
      if (date) row.date = date;
      if (typeof m.cost === 'number') row.cost = r4(m.cost);
      if (typeof m.output_tokens === 'number') row.tokens = Math.round(m.output_tokens);
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('WaterfallBench: parsed zero rows');
    return rows;
  },
};

export default board;
