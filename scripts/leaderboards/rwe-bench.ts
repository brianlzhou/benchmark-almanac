// RWE-Bench (Xplore). xplore.ai/rwe-bench fills its leaderboard from /js/rwe-data.js ("every number on
// /rwe-bench comes from this file"): window.RWE.models lists one object per model with name, harness,
// effort, pass1 (average pass rate, %, which sets the page's order and rank), pass@k, cost (mean API spend
// for one run of one task, USD) and outTokensK. pass1 is the score. The file uses single-quoted strings,
// which the shared literal reader does not take, so each model line is read with patterns.
// Metrics from the same lines: the 95% credible interval of pass1 (lo, hi as ciLow, ciHigh), pass@2 to pass@5
// from passAtK (Figure 1, as passAt2 ... passAt5) and time per run (hours, kept as latency in seconds), which
// Figure 2 plots against pass1 with a Pareto frontier.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://xplore.ai';
const FEED = `${SITE}/js/rwe-data.js`;

const field = (obj: string, key: string) => obj.match(new RegExp(`\\b${key}:\\s*('([^']*)'|null|-?[\\d.]+)`))?.[2] ?? obj.match(new RegExp(`\\b${key}:\\s*(-?[\\d.]+)`))?.[1];

const board: Leaderboard = {
  benchmark: 'rwe-bench',
  url: `${SITE}/rwe-bench`,
  feed: `${FEED} (window.RWE.models, pass1)`,
  terms: 'Data file the public page loads; robots.txt allows / for all user agents except named AI crawlers (content signal use=reference, ai-train=no).',
  chart: {
    title: 'Average pass rate against cost or time per run',
    note: 'Figure 2 with time on the x axis: each point is one model in its harness, and the Pareto frontier joins the models no other passes more for less time.',
    x: { key: 'latency', label: 'Time per run', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Average pass rate', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const js = await fetchText(FEED);
    const start = js.indexOf('models:');
    if (start < 0) throw new Error('RWE models list not found');
    const end = js.indexOf('unscored:', start);
    const rows: LeaderboardRow[] = [];
    // one model per line: { name: '...', lab: '...', harness: '...', effort: '...', pass1: 37, ... }
    for (const m of js.slice(start, end > 0 ? end : undefined).matchAll(/^\s*\{\s*name:.*$/gm)) {
      const obj = m[0];
      const name = field(obj, 'name');
      const score = Number(field(obj, 'pass1'));
      const cost = Number(field(obj, 'cost'));
      const tokens = Number(field(obj, 'outTokensK'));
      if (!name || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      const lo = Number(field(obj, 'lo'));
      const hi = Number(field(obj, 'hi'));
      if (Number.isFinite(lo) && Number.isFinite(hi)) Object.assign(metrics, { ciLow: lo, ciHigh: hi });
      const passAtK = obj.match(/\bpassAtK:\s*\[([^\]]*)\]/)?.[1].split(',').map(Number) ?? [];
      passAtK.forEach((v, i) => {
        if (i > 0 && Number.isFinite(v)) metrics[`passAt${i + 1}`] = v;
      });
      const hours = Number(field(obj, 'time'));
      if (Number.isFinite(hours) && hours > 0) metrics.latency = Math.round(hours * 3600);
      rows.push({
        model: name,
        score,
        setting: field(obj, 'effort') || undefined,
        harness: field(obj, 'harness') || undefined,
        cost: Number.isFinite(cost) && cost > 0 ? cost : undefined,
        tokens: Number.isFinite(tokens) && tokens > 0 ? tokens * 1000 : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
