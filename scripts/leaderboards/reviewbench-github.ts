// ReviewBench. review-bench.ai is a Vite app whose leaderboard reads its own JSON endpoint,
// /api/leaderboard/metrics, with the page's default view (Scores: Grounded, Severity: High). Per reviewer
// configuration it gives grounded precision and recall (0 to 100) and the snapshot date. The table's F1 is
// their harmonic mean, 2PR/(P+R), which is the score. Most entries are code-review products with no model
// named; only configurations whose label names a model ("model=gpt-5.6-sol · reasoning=max") are read, with
// the product as the harness and the reasoning or effort value as the setting. The snapshot date is the run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://review-bench.ai/api/leaderboard/metrics?severities=High&preference=balanced&rankingMetric=grounded';

interface Metric {
  tableName: string;
  configurationLabel: string | null;
  snapshotDate?: string;
  groundedPrecision?: number;
  groundedRecall?: number;
}

const board: Leaderboard = {
  benchmark: 'reviewbench-github',
  url: 'https://review-bench.ai/',
  feed: `${FEED} (grounded F1 from precision and recall)`,
  terms: 'JSON endpoint behind the ReviewBench page; robots.txt allows all, and the site terms put its content under CC BY-NC 4.0 and allow automated access that does not degrade the service.',
  async fetch() {
    const data = await fetchJson<{ reviewerMetrics: Metric[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.reviewerMetrics) {
      const conf = Object.fromEntries((r.configurationLabel ?? '').split('·').map((kv) => kv.trim().split('=')).filter((kv) => kv.length === 2));
      const p = r.groundedPrecision;
      const rc = r.groundedRecall;
      if (!conf.model || typeof p !== 'number' || typeof rc !== 'number' || p + rc === 0) continue;
      rows.push({
        model: conf.model,
        score: Number(((2 * p * rc) / (p + rc)).toFixed(1)),
        setting: conf.reasoning ?? conf.effort,
        harness: r.tableName,
        date: /^\d{4}-\d\d-\d\d$/.test(r.snapshotDate ?? '') ? r.snapshotDate : undefined,
      });
    }
    return rows;
  },
};
export default board;
