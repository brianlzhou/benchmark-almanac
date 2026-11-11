// Offline Code Review Bench: products are evaluated; top-level model keys identify judges.
// Keep all published judge configurations and the board's default core/F2 metric.
// Product names remain unlisted because the benchmark does not identify their underlying models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const URL = 'https://codereview.withmartian.com';
type Stats = { precision: number; recall: number; f1: number; f2: number; tp: number; fp: number; fn: number; num_prs: number };
const board: Leaderboard = {
  benchmark: 'martian-code-review-bench', url: URL, feed: `${URL}/benchmark_dashboard.json`,
  terms: 'Public benchmark data from Martian; the repository uses Apache-2.0. The almanac credits Martian and links the source.',
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ default_profile: string; default_beta: number; tool_display_names: Record<string,string>; models: Record<string,{ overall_metrics: Record<string,Record<string,Stats>> }> }>(`${URL}/benchmark_dashboard.json`);
    const speeds = await fetchJson<Record<string,{ stats: { median_seconds: number; mean_seconds: number }; failed_count: number }>>(`${URL}/speed_analysis.json`);
    if (data.default_profile !== 'core' || data.default_beta !== 2) throw new Error('Martian default scoring changed');
    const rows: LeaderboardRow[] = [];
    for (const [judge, results] of Object.entries(data.models)) {
      for (const [product, profiles] of Object.entries(results.overall_metrics)) {
        const s = profiles.core;
        if (!s || !Number.isFinite(s.f2)) continue;
        const speed = speeds[product];
        rows.push({ model: `${data.tool_display_names[product] ?? product} (product; model unspecified)`, score: s.f2,
          setting: `core; F2; judge ${judge}; product ${product}`,
          metrics: { precision: s.precision, recall: s.recall, f1: s.f1, prs: s.num_prs, tp: s.tp, fp: s.fp, fn: s.fn,
            ...(speed ? { latency: speed.stats.median_seconds, latencyMean: speed.stats.mean_seconds, failedRuns: speed.failed_count } : {}) } });
      }
    }
    if (!rows.length) throw new Error('Martian product results missing');
    return rows;
  },
};
export default board;
