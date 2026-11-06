// ShadowBench (Perpetual Research): models pose two 3D hands, one tool call at a time, until their shadow matches a
// plate from a nineteenth-century hand-shadow book. The board is the dataset's `leaderboard` config, read through
// Hugging Face's dataset viewer API: one row per model and reasoning effort, with the mean score out of 100 over
// 20 plates and its 95% bootstrap interval, and the token cost of one episode in US dollars. The three reference
// rows (a featureless blob, blind search and hands at rest) are not models, so the benchmark's note gives them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DATASET = 'perpetual-research/shadowbench';
const FEED = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DATASET)}&config=leaderboard&split=results&offset=0&length=100`;

interface Row {
  kind: string;
  model_name: string;
  effort: string | null;
  score: number;
  ci_low: number | null;
  ci_high: number | null;
  iou: number | null;
  boundary_f1: number | null;
  cost_usd_per_episode: number | null;
  minutes_per_episode: number | null;
}

const board: Leaderboard = {
  benchmark: 'shadowbench',
  url: 'https://huggingface.co/spaces/perpetual-research/shadowbench-explorer',
  feed: `${FEED} (score)`,
  terms: "The dataset's episodes and analysis are CC BY 4.0 and its code is MIT, per the dataset's LICENSE.md.",
  async fetch() {
    const { rows } = await fetchJson<{ rows: { row: Row }[] }>(FEED);
    const out: LeaderboardRow[] = [];
    for (const { row: r } of rows) {
      if (r.kind !== 'model' || !Number.isFinite(r.score)) continue;
      const metrics: Record<string, number> = {};
      if (r.ci_low != null) metrics.ciLow = r.ci_low;
      if (r.ci_high != null) metrics.ciHigh = r.ci_high;
      if (r.iou != null) metrics.iou = r.iou * 100;
      if (r.boundary_f1 != null) metrics.outline = r.boundary_f1 * 100;
      if (r.minutes_per_episode != null) metrics.minutes = r.minutes_per_episode;
      out.push({
        model: r.model_name,
        setting: r.effort ? `${r.effort} effort` : undefined,
        score: r.score,
        date: '2026-11-05',
        cost: r.cost_usd_per_episode ?? undefined,
        metrics,
      });
    }
    if (out.length < 6) throw new Error(`ShadowBench board has ${out.length} model rows`);
    return out;
  },
};
export default board;
