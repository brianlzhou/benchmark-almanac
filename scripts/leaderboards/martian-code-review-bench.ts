// Offline Code Review Bench: products are evaluated; top-level model keys identify judges.
// Keep all judge configurations, profile measures and the published review timing distribution.
// Product names remain unlisted because the benchmark does not identify their underlying models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const URL = 'https://codereview.withmartian.com';
type Stats = { precision: number; recall: number; f1: number; f2: number; tp: number; fp: number; fn: number; num_prs: number };
const board: Leaderboard = {
  benchmark: 'martian-code-review-bench', url: URL, feed: `${URL}/benchmark_dashboard.json`,
  terms: 'Public benchmark data from Martian; the repository uses Apache-2.0. The almanac credits Martian and links the source.',
  stats: {
    strictPrecision: { name: 'Strict precision', unit: '%', better: 'higher' }, strictRecall: { name: 'Strict recall', unit: '%', better: 'higher' }, strictF1: { name: 'Strict F1', unit: '%', better: 'higher' }, strictF2: { name: 'Strict F2', unit: '%', better: 'higher' }, strictTp: { name: 'Strict true positives', unit: 'count' }, strictFp: { name: 'Strict false positives', unit: 'count' }, strictFn: { name: 'Strict false negatives', unit: 'count' }, strictNum_prs: { name: 'Strict pull requests', unit: 'count' },
    allPrecision: { name: 'All precision', unit: '%', better: 'higher' }, allRecall: { name: 'All recall', unit: '%', better: 'higher' }, allF1: { name: 'All F1', unit: '%', better: 'higher' }, allF2: { name: 'All F2', unit: '%', better: 'higher' }, allTp: { name: 'All true positives', unit: 'count' }, allFp: { name: 'All false positives', unit: 'count' }, allFn: { name: 'All false negatives', unit: 'count' }, allNum_prs: { name: 'All pull requests', unit: 'count' },
    precision: { name: 'Precision', unit: '%', better: 'higher' }, recall: { name: 'Recall', unit: '%', better: 'higher' }, f1: { name: 'F1', unit: '%', better: 'higher' }, prs: { name: 'Pull requests', unit: 'count' }, tp: { name: 'True positives', unit: 'count' }, fp: { name: 'False positives', unit: 'count' }, fn: { name: 'False negatives', unit: 'count' },
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' }, latencyMean: { name: 'Mean latency', unit: 'seconds', better: 'lower' }, timingSamples: { name: 'Timing samples', unit: 'count' }, latencyP25: { name: '25th percentile latency', unit: 'seconds', better: 'lower' }, latencyP75: { name: '75th percentile latency', unit: 'seconds', better: 'lower' }, latencyMin: { name: 'Minimum latency', unit: 'seconds', better: 'lower' }, latencyMax: { name: 'Maximum latency', unit: 'seconds', better: 'lower' }, failedRuns: { name: 'Failed runs', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ default_profile: string; default_beta: number; tool_display_names: Record<string,string>; models: Record<string,{ overall_metrics: Record<string,Record<string,Stats>> }> }>(`${URL}/benchmark_dashboard.json`);
    const speeds = await fetchJson<Record<string,{ stats: { median_seconds: number; mean_seconds: number; count: number; p25_seconds: number; p75_seconds: number; min_seconds: number; max_seconds: number }; failed_count: number }>>(`${URL}/speed_analysis.json`);
    if (data.default_profile !== 'core' || data.default_beta !== 2) throw new Error('Martian default scoring changed');
    const rows: LeaderboardRow[] = [];
    for (const [judge, results] of Object.entries(data.models)) {
      for (const [product, profiles] of Object.entries(results.overall_metrics)) {
        const s = profiles.core;
        if (!s || !Number.isFinite(s.f2)) continue;
        const speed = speeds[product];
        const alternatives: Record<string, number> = {};
        for (const profile of ['strict', 'all']) {
          for (const [key, value] of Object.entries(profiles[profile] ?? {})) {
            if (typeof value === 'number') alternatives[profile + key[0].toUpperCase() + key.slice(1)] = value;
          }
        }
        rows.push({ model: `${data.tool_display_names[product] ?? product} (product; model unspecified)`, score: s.f2,
          setting: `core; F2; judge ${judge}; product ${product}`,
          metrics: { ...alternatives, precision: s.precision, recall: s.recall, f1: s.f1, prs: s.num_prs, tp: s.tp, fp: s.fp, fn: s.fn,
            ...(speed ? { latency: speed.stats.median_seconds, latencyMean: speed.stats.mean_seconds, timingSamples: speed.stats.count, latencyP25: speed.stats.p25_seconds,
              latencyP75: speed.stats.p75_seconds, latencyMin: speed.stats.min_seconds, latencyMax: speed.stats.max_seconds, failedRuns: speed.failed_count } : {}) } });
      }
    }
    if (!rows.length) throw new Error('Martian product results missing');
    return rows;
  },
};
export default board;
