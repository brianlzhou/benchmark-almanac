// Guesswork ranks predictions by mean absolute error in per-benchmark standard deviation units.
// The page reads its monthly standings from the prediction duel JSON and defaults to the latest ranked month.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://theaggregate.ai/data/prediction-duel.json";
type Entry = { id: string; ranked: boolean; mae_z: number; ci95: number[]; cost_usd: number; n: number; coverage: number; asked: number; imputed: number; tokens: number; win_vs_aggregate: number };
type Month = { month: string; ranked?: boolean; n_common_cells?: number; n_cells: number; min_ranked_cells?: number; contestants: Entry[] };

const board: Leaderboard = {
  benchmark: "the-aggregate-guesswork",
  url: "https://theaggregate.ai/guesswork",
  feed,
  terms: "Credit The Aggregate when quoting or charting scores. Bulk republication requires written permission. https://theaggregate.ai/terms robots.txt allows the feed path.",
  costPer: 'run',
  async fetch() {
    const { months } = await fetchJson<{ months: Month[] }>(feed);
    const month = months.find(m => m.ranked ?? ((m.n_common_cells ?? m.n_cells) >= (m.min_ranked_cells ?? 50)));
    if (!month) throw new Error('Missing ranked Guesswork month');
    const entries = month.contestants.filter(r => r.id !== 'aggregate' && r.ranked !== false);
    if (entries.length < 32) throw new Error('Incomplete Guesswork model panel');
    return entries.map(r => {
      if (!Number.isFinite(r.mae_z) || !r.ci95?.every(Number.isFinite) || r.ci95.length !== 2) throw new Error('Incomplete prediction error');
      return { model: r.id, score: r.mae_z, low: r.ci95[0], high: r.ci95[1], cost: r.cost_usd, setting: month.month,
        metrics: { predictions: r.n, answered: r.coverage, asked: r.asked, imputed: r.imputed, totalTokens: r.tokens,
          winVsAggregate: r.win_vs_aggregate * 100 } };
    });
  },
};
export default board;
