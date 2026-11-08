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
    for (const r of parseCsv(await fetchText(FEED))) {
      if (r.split !== 'nonparallel' || !r.model_id || !r.acc.trim()) continue;
      const score = Number(r.acc) * 100;
      if (!Number.isFinite(score)) continue;
      rows.push({ model: r.model_id + (r.type === 'base' ? ' (base)' : ''), score,
        setting: `${r.metric_used}; ${r.type}` });
    }
    if (!rows.length) throw new Error('No aggregate accuracy rows');
    return rows;
  },
};
export default board;
