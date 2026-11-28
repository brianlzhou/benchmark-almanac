// RehearsalBench (Afterflow): models plan operational changes and forecast their financial effect in a simulated
// bank contact center over 600 runs per plan. Afterflow publishes the full Round 3 results table as a direct CSV
// with 95% confidence bounds (cost_saved_pct_lo95, cost_saved_pct_hi95) and API cost per run, and draws a log-scale
// scatter plot titled "Cost per run and running cost saved" on the results page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const SITE = 'https://afterflow.dev/research/rehearsalbench';
const FEED = `${SITE}/leaderboard.csv`;

const numOrUndef = (s: string | undefined) => {
  if (!s || !s.trim()) return undefined;
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : undefined;
};

const board: Leaderboard = {
  benchmark: 'rehearsalbench',
  url: SITE,
  feed: FEED,
  terms: 'Afterflow’s robots.txt allows all crawlers on its pages and publishes the Round 3 leaderboard CSV directly.',
  aliases: { 'Mistral Small 2603': 'mistral-small-4' },
  costPer: 'run',
  notModels: /^Always (do nothing|predict no effect) \(baseline\)$/i,
  stats: {
    forecastAccuracy: {
      name: 'Forecast accuracy',
      unit: '%',
      better: 'higher',
      note: 'Percentage reduction in forecast error compared with always predicting no effect.',
    },
    forecastScore: {
      name: 'Forecast error score',
      unit: 'score',
      better: 'lower',
      note: 'Underlying forecast error score used to compute forecast accuracy.',
    },
    meanValueUsd: {
      name: 'Mean value vs no change',
      unit: 'usd',
      better: 'higher',
      note: 'Mean simulated dollar value gained per run relative to doing nothing.',
    },
    robustValueUsd: {
      name: 'Robust value vs no change',
      unit: 'usd',
      better: 'higher',
      note: 'Downside-weighted simulated dollar value gained per run relative to doing nothing.',
    },
    validRunsPct: {
      name: 'Valid runs',
      unit: '%',
      better: 'higher',
      note: 'Share of simulated bank runs that produced a valid operational plan.',
    },
  },
  chart: {
    title: 'Cost per run and running cost saved',
    x: { key: 'cost', label: 'Cost per run', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Cost saved', unit: '%', better: 'higher' },
    note: 'Simulated running cost saved plotted against API cost per run on a log scale, redrawn from Afterflow.',
  },
  async fetch() {
    const csv = await fetchText(FEED);
    const rows = parseCsv(csv);
    if (rows.length < 8) throw new Error(`RehearsalBench CSV changed: only ${rows.length} rows`);
    const out: LeaderboardRow[] = [];
    for (const r of rows) {
      const rawModel = r.model?.trim();
      if (!rawModel) continue;
      // Baseline rows such as "Always predict no effect (baseline)" have no cost_saved_pct; let non-scored baselines skip cleanly
      const score = numOrUndef(r.cost_saved_pct);
      if (score === undefined) continue;
      const isPartial = /\(partial\)$/i.test(rawModel);
      const model = rawModel.replace(/\s*\(partial\)$/i, '').trim();
      const lo = numOrUndef(r.cost_saved_pct_lo95);
      const hi = numOrUndef(r.cost_saved_pct_hi95);
      const cost = numOrUndef(r.api_cost_per_run_usd);
      const validRunsPct = numOrUndef(r.valid_runs_pct);
      const forecastAccuracy = numOrUndef(r.forecast_accuracy_pct);
      const forecastScore = numOrUndef(r.forecast_score);
      const meanValueUsd = numOrUndef(r.mean_value_vs_no_change_usd);
      const robustValueUsd = numOrUndef(r.robust_value_vs_no_change_usd);
      const metrics: Record<string, number> = {};
      if (forecastAccuracy !== undefined) metrics.forecastAccuracy = forecastAccuracy;
      if (forecastScore !== undefined) metrics.forecastScore = forecastScore;
      if (meanValueUsd !== undefined) metrics.meanValueUsd = meanValueUsd;
      if (robustValueUsd !== undefined) metrics.robustValueUsd = robustValueUsd;
      if (validRunsPct !== undefined) metrics.validRunsPct = validRunsPct;
      out.push({
        model,
        score,
        ...(lo !== undefined && hi !== undefined ? { low: lo, high: hi } : {}),
        ...(cost !== undefined ? { cost } : {}),
        ...(isPartial ? { setting: `Partial run (${validRunsPct ?? '?'}% valid)` } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (out.length < 8) throw new Error(`RehearsalBench CSV produced only ${out.length} scored rows`);
    return out;
  },
};

export default board;
