// OTelBench (Quesma) on quesma.com/benchmarks/otel. The page is static HTML whose main ranking is a list of
// bars, one per model: a row titled "20 passed, 49 failed (69 total runs)" holding the model's link
// (/benchmarks/otel/models/<slug>/) and its pass-rate bar. The pass rate, passed over total runs (0 to
// 100), is the score. The page rounds it to whole percents. Later charts on the page repeat the models, so
// only the first row for each model is kept. quesmaRows is shared with the other Quesma benchmark pages.
// The page's scatter charts carry each model's numbers as JSON in a data-chart-data attribute: totalCost,
// the US dollars of the whole run (kept as cost, so the board sets costPer 'run'), avgDurationSec (kept as
// metrics.latency, seconds per task) and, on BinaryAudit, fpr (kept as metrics.fpr, a percentage).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

export const QUESMA_TERMS = 'Static public page of quesma.com; robots.txt allows all paths and the site publishes no terms for its benchmark pages.';

interface QuesmaPoint {
  displayName?: string;
  totalCost?: number;
  avgDurationSec?: number;
  fpr?: number;
}

export async function quesmaRows(slug: string): Promise<LeaderboardRow[]> {
  const html = await fetchText(`https://quesma.com/benchmarks/${slug}/`);
  // each scatter chart repeats the models; later ones add fields (fpr), so merge them by display name
  const points = new Map<string, QuesmaPoint>();
  for (const m of html.matchAll(/class="scatter-chart[^"]*"[^>]*data-chart-data="([^"]*)"/g))
    for (const p of JSON.parse(text(m[1])) as QuesmaPoint[])
      if (p.displayName) points.set(p.displayName, { ...points.get(p.displayName), ...p });
  const rows: LeaderboardRow[] = [];
  const seen = new Set<string>();
  const re = new RegExp(`title="(\\d+) passed, (\\d+) failed \\((\\d+) total runs\\)"(?:(?!title="\\d+ passed)[\\s\\S]){0,4000}?<a href="/benchmarks/${slug}/models/[^"]+"[^>]*>([\\s\\S]*?)</a>`, 'g');
  for (const m of html.matchAll(re)) {
    const model = text(m[4]);
    const total = Number(m[3]);
    if (!model || !total || seen.has(model)) continue;
    seen.add(model);
    const p = points.get(model);
    const metrics: Record<string, number> = {};
    if (typeof p?.avgDurationSec === 'number') metrics.latency = p.avgDurationSec;
    if (typeof p?.fpr === 'number') metrics.fpr = p.fpr * 100;
    rows.push({
      model,
      score: (Number(m[1]) / total) * 100,
      cost: typeof p?.totalCost === 'number' ? p.totalCost : undefined,
      metrics: Object.keys(metrics).length ? metrics : undefined,
    });
  }
  if (!rows.length) throw new Error(`no ranking rows on the Quesma ${slug} page`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'otelbench',
  url: 'https://quesma.com/benchmarks/otel/',
  feed: 'https://quesma.com/benchmarks/otel/ (ranking bars, passed over total runs; scatter-chart data for cost and time)',
  terms: QUESMA_TERMS,
  aliases: {},
  costPer: 'run',
  chart: {
    title: 'Speed vs quality',
    note: 'Pass rate against average generation time per task; the Pareto frontier marks models no other beats on both.',
    x: { key: 'latency', label: 'Average time per task', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Pass rate', unit: '%', better: 'higher' },
  },
  fetch: () => quesmaRows('otel'),
};
export default board;
