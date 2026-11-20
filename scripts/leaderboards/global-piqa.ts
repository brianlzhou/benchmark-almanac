// Global PIQA: use nonparallel accuracy only, the 2025 benchmark this record describes.
// The parallel split is a different test. The official CSV publishes each split’s aggregate.
// Accuracy becomes a percentage. Metric type and model type stay in the setting because base-model
// likelihood accuracy and instruction-model exact match are different evaluation configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/mrlbenchmarks/global-piqa/main/eval_results/aggregated_by_split.csv';
const board: Leaderboard = {
  benchmark: 'global-piqa', url: 'https://github.com/mrlbenchmarks/global-piqa', feed: FEED,
  terms: 'Public aggregate results in the authors’ repository, attributed to the Global PIQA authors.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    const aggregates = parseCsv(await fetchText(FEED));
    const key = (r: Record<string, string>) => JSON.stringify([r.model_id, r.type, r.metric_used]);
    const byRun = new Map<string, Record<string, number>>();
    for (const r of aggregates) {
      if (r.split === 'parallel' && r.acc.trim() && Number.isFinite(Number(r.acc))) byRun.set(key(r), { parallel: Number(r.acc) * 100 });
    }
    await new Promise(resolve => setTimeout(resolve, 1050));
    const languages = parseCsv(await fetchText(new URL('results_per_language.csv', FEED).href));
    board.parts = {};
    for (const r of languages) {
      if (r.split !== 'nonparallel' || !r.language || !r.acc.trim() || !Number.isFinite(Number(r.acc))) continue;
      const metrics = byRun.get(key(r)) ?? {};
      metrics[r.language] = Number(r.acc) * 100;
      byRun.set(key(r), metrics);
      board.parts[r.language] = { name: r.language, group: 'Language' };
    }
    for (const r of aggregates) {
      if (r.split !== 'nonparallel' || !r.model_id || !r.acc.trim()) continue;
      const score = Number(r.acc) * 100;
      if (!Number.isFinite(score)) continue;
      rows.push({ model: r.model_id + (r.type === 'base' ? ' (base)' : ''), score,
        params: Number(r.params_n) > 0 ? Number(r.params_n) / 1e9 : undefined,
        open: r.access === 'open' ? true : r.access === 'closed' ? false : undefined,
        metrics: byRun.get(key(r)), setting: `${r.metric_used}; ${r.type}` });
    }
    if (!rows.length) throw new Error('No aggregate accuracy rows');
    return rows;
  },
};
export default board;
