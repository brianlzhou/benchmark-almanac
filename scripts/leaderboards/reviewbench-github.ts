// ReviewBench. review-bench.ai is a Vite app whose leaderboard reads its own JSON endpoint,
// /api/leaderboard/metrics, with the page's default view (Scores: Grounded, Severity: High). Per reviewer
// configuration it gives grounded precision and recall (0 to 100) and the snapshot date. The table's F1 is
// their harmonic mean, 2PR/(P+R), which is the score. Most entries are code-review products with no model
// named. All scored configurations are retained. A named model uses the product as its harness,
// and unnamed products remain unlisted systems. Reasoning or effort is the setting. The snapshot date is the run.
// Each row also carries grounded precision and recall ("precision", "recall", %) and the mean review duration
// ("duration", seconds, durationMs / 1000), which the page's "Grounded F1 / duration" Pareto chart plots.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://review-bench.ai/api/leaderboard/metrics?severities=High&preference=balanced&rankingMetric=grounded';

interface Metric {
  tableName: string;
  configurationLabel: string | null;
  snapshotDate?: string;
  groundedPrecision?: number;
  groundedRecall?: number;
  durationMs?: number | null;
}

const board: Leaderboard = {
  benchmark: 'reviewbench-github',
  url: 'https://review-bench.ai/',
  feed: `${FEED} (grounded F1 from precision and recall)`,
  chart: {
    title: 'Grounded F1 / duration',
    note: 'Each point is one reviewer configuration; highlighted points are not outperformed on both axes by another.',
    x: { key: 'duration', label: 'Duration', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Grounded F1', unit: '%', better: 'higher' },
  },
  terms: 'JSON endpoint behind the ReviewBench page; robots.txt allows all, and the site terms put its content under CC BY-NC 4.0 and allow automated access that does not degrade the service.',
  async fetch() {
    const data = await fetchJson<{ reviewerMetrics: Metric[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.reviewerMetrics) {
      const conf = Object.fromEntries((r.configurationLabel ?? '').split('·').map((kv) => kv.trim().split('=')).filter((kv) => kv.length === 2));
      const p = r.groundedPrecision;
      const rc = r.groundedRecall;
      if (typeof p !== 'number' || typeof rc !== 'number' || p + rc === 0) continue;
      rows.push({
        model: conf.model || r.tableName,
        score: Number(((2 * p * rc) / (p + rc)).toFixed(1)),
        setting: conf.reasoning ?? conf.effort ?? (conf.model ? undefined : r.configurationLabel ?? undefined),
        harness: r.tableName,
        date: /^\d{4}-\d\d-\d\d$/.test(r.snapshotDate ?? '') ? r.snapshotDate : undefined,
        metrics: {
          precision: Number(p.toFixed(2)),
          recall: Number(rc.toFixed(2)),
          ...(typeof r.durationMs === 'number' && r.durationMs > 0 ? { duration: Number((r.durationMs / 1000).toFixed(1)) } : {}),
        },
      });
    }
    return rows;
  },
};
export default board;
