// EJBench scores engineering judgments about cooling plates across three task families.
// Its leaderboard CSV reports the macro mean, uncertainty interval and resource use.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/GradientDynamics/EJBench/resolve/main/leaderboard/leaderboard.csv";
const board: Leaderboard = {
  benchmark: "ejbench",
  url: "https://huggingface.co/datasets/GradientDynamics/EJBench#leaderboard",
  feed,
  terms: "The dataset uses CC BY-NC 4.0. Hugging Face robots.txt allows the feed.",
  parts: { campaign: 'Campaign', evidence: 'Evidence', envelope: 'Envelope' },
  async fetch() {
    const entries = parseCsv(await fetchText(feed));
    if (entries.length < 12) throw new Error('Missing EJBench models');
    return entries.map(r => {
      const num = (key: string) => {
        if (!r[key]?.trim() || !Number.isFinite(Number(r[key]))) throw new Error('Invalid EJBench field ' + key);
        return Number(r[key]);
      };
      const tasks = num('tasks_scored'), trials = num('runs');
      if (!r.model || !r.effort || !r.date_run || tasks <= 0 || trials <= 0) throw new Error('Incomplete EJBench entry');
      return { model: r.model, setting: r.effort, score: num('macro_mean'), date: r.date_run,
        low: num('macro_ci_low'), high: num('macro_ci_high'), trials, cost: r.cost_per_task_usd ? num('cost_per_task_usd') : undefined,
        metrics: { campaign: num('campaign_mean'), evidence: num('evidence_mean'), envelope: num('envelope_mean'),
          calibrationMse: num('calibration_mse'), outputTokens: num('output_tokens'), tasks,
          ...(r.cost_usd ? { totalCostUsd: num('cost_usd') } : {}) } };
    });
  },
};
export default board;
