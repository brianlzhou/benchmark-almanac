// K-Bench scores mental health conversations on a 100-point scale. Its public bundle gives overall scores and clinical dimensions for each prompt and reasoning setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.k-bench.ai/data/latest/site_data.json";

const board: Leaderboard = {
  benchmark: "k-bench-mental-health-safety",
  url: "https://www.k-bench.ai/",
  feed,
  terms: "The site publishes aggregate leaderboard outputs and keeps operational prompts, transcript-level artifacts, and scoring details private. https://www.k-bench.ai/methodology/index.html The feed host publishes robots.txt at https://www.k-bench.ai/robots.txt.",
  async fetch() {
    type Result = { base_model: string; bundle_label: string; provider_prompt_label: string; provider_reasoning_level: string; overall_score_0_to_100: number; combined_risk_score_0_to_100: number };
    type Dimension = { dimension_key: string; label: string; model_scores: { bundle_label: string; normalized_mean: number }[] };
    const data = await fetchJson<{meta: { model_count: number }; leaderboard: { rows: Result[] }; detailTable: { rows: Dimension[] } }>(feed);
    const results = data.leaderboard.rows;
    if (results.length < 125 || results.length !== data.meta.model_count) throw new Error('Incomplete K-Bench ranking');
    board.parts = { risk: 'Combined risk' };
    for (const d of data.detailTable.rows) board.parts[d.dimension_key] = d.label.replace('judgement', 'judgment');
    return results.map(r => {
      const score = r.overall_score_0_to_100;
      if (!r.base_model || !Number.isFinite(score)) throw new Error('Missing overall score');
      const metrics: Record<string, number> = { risk: r.combined_risk_score_0_to_100 };
      for (const d of data.detailTable.rows) {
        const value = d.model_scores.find(m => m.bundle_label === r.bundle_label)?.normalized_mean;
        if (typeof value === 'number') metrics[d.dimension_key] = value * 100;
      }
      return { model: r.base_model, setting: [r.provider_prompt_label, r.provider_reasoning_level].filter(Boolean).join(', '), score, metrics };
    });
  },
};
export default board;
