// K-Bench scores mental health conversations on a 100-point scale. Its public bundle gives overall scores and clinical dimensions for each prompt and reasoning setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.k-bench.ai/data/latest/site_data.json";

const board: Leaderboard = {
  benchmark: "k-bench-mental-health-safety",
  url: "https://www.k-bench.ai/",
  feed,
  terms: "The site publishes aggregate leaderboard outputs and keeps operational prompts, transcript-level artifacts, and scoring details private. https://www.k-bench.ai/methodology/index.html The feed host publishes robots.txt at https://www.k-bench.ai/robots.txt.",
  parts: {
    risk: { name: 'Combined risk', group: 'Summary' },
    D1: { name: 'Clinical judgment', group: 'Dimension' },
    D2: { name: 'Risk exploration', group: 'Dimension' },
    D3: { name: 'Ethical reasoning', group: 'Dimension' },
    D4: { name: 'Supportive conversation', group: 'Dimension' },
    D5: { name: 'Psychological knowledge', group: 'Dimension' },
    D6: { name: 'Cultural competence', group: 'Dimension' },
    D7: { name: 'Autonomy and boundaries', group: 'Dimension' },
  },
  chart: {
    title: 'Overall score vs. combined risk',
    x: { key: 'score', label: 'Overall score', better: 'higher' },
    y: { key: 'risk', label: 'Combined risk score', better: 'higher' },
    note: 'K-Bench plots combined mental health risk score against overall clinical score (higher is safer on both axes).',
  },
  async fetch() {
    type Result = { base_model: string; bundle_label: string; provider_prompt_label: string; provider_reasoning_level: string; overall_score_0_to_100: number; combined_risk_score_0_to_100: number };
    type Dimension = { dimension_key: string; label: string; model_scores: { bundle_label: string; normalized_mean: number }[] };
    const data = await fetchJson<{meta: { model_count: number }; leaderboard: { rows: Result[] }; detailTable: { rows: Dimension[] } }>(feed);
    const results = data.leaderboard.rows;
    if (results.length < 125 || results.length !== data.meta.model_count) throw new Error('Incomplete K-Bench ranking');
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
