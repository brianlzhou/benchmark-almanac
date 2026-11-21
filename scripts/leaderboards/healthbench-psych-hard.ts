// HealthBench-Psych-Hard uses a three-judge panel to grade mental health answers.
// Compute the authors' panel mean from the three clipped scores for each candidate in the official CSV.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/mindbench-ai/healthbench-psych/main/eval/runs/matrix_healthbench-psych-hard-v1.csv";
const board: Leaderboard = {
  benchmark: "healthbench-psych-hard",
  url: "https://github.com/mindbench-ai/healthbench-psych/blob/main/eval/runs/matrix_healthbench-psych-hard-v1.csv",
  feed: FEED,
  terms: "MindBench.ai uses the MIT license. Vendored HealthBench materials retain their original MIT terms. https://github.com/mindbench-ai/healthbench-psych#license The raw file host has no robots.txt.",
  async fetch() {
    const records = parseCsv(await fetchText(FEED));
    const byModel = new Map<string, Record<string, number>>();
    for (const r of records) {
      if (!r.candidate || !r.judge || !r.clipped_mean_score?.trim() || !Number.isFinite(Number(r.clipped_mean_score)) || Number(r.n_prompts) !== 119) throw new Error('Invalid Hard panel row');
      const metrics = byModel.get(r.candidate) ?? {};
      if (r.judge in metrics) throw new Error('Duplicate judge for ' + r.candidate);
      metrics[r.judge] = Number(r.clipped_mean_score);
      byModel.set(r.candidate, metrics);
    }
    if (byModel.size < 28) throw new Error('Missing Hard candidates');
    return [...byModel].map(([model, metrics]) => {
      const values = Object.values(metrics);
      if (values.length !== 3) throw new Error('Incomplete panel for ' + model);
      return { model, score: values.reduce((a,b) => a + b, 0) / 3, metrics: { ...metrics, prompts: 119 } };
    });
  },
};
export default board;
