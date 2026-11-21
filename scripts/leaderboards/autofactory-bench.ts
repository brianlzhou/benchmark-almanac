// AutoFactory-Bench ranks agents by pass@1 on its 30 hard factory-control tasks.
// The leaderboard loads bench.json with run counts, confidence bounds, safety measures and costs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://www.autofactorybench.com/data/bench.json";

const board: Leaderboard = {
  benchmark: "autofactory-bench",
  url: "https://www.autofactorybench.com/leaderboard",
  feed,
  terms: "The maker offers research access and licensing for the full data. The public leaderboard does not specify score reuse terms. https://www.autofactorybench.com/ Robots.txt permits the public data path.",
  parts: { easy: 'Easy', medium: 'Medium', overall: 'All 100 tasks' },
  async fetch() {
    type Model = { id: string; label: string; harness: string; servedVia?: string };
    type Run = { modelId: string; overall: number; easy: number; medium: number; trials: number; noProgramTrials: number;
      hardPass1: { mean: number; lo: number; hi: number; trials: number; tasks: number };
      safetyViolationRate: number; costPerTrial: number; hardCostPerTrial: number; goalMetUnsafe: { all: number; hard: number };
      hardPassAtK: Record<string, number>; hardPassHatK: Record<string, number> };
    const { models, leaderboard } = await fetchJson<{ models: Model[]; leaderboard: Run[] }>(feed);
    if (leaderboard.length < 11 || leaderboard.length !== models.length) throw new Error('Missing AutoFactory agents');
    return leaderboard.map(r => {
      const model = models.find(m => m.id === r.modelId);
      const hard = r.hardPass1;
      const metrics: Record<string, number> = { easy: 100*r.easy, medium: 100*r.medium, overall: 100*r.overall,
        costPerTrial: r.costPerTrial, fullBenchCost: r.costPerTrial*r.trials, totalTrials: r.trials, hardTrials: hard.trials,
        noProgramTrials: r.noProgramTrials, safetyViolationRate: 100*r.safetyViolationRate,
        goalMetUnsafe: 100*r.goalMetUnsafe.all, hardGoalMetUnsafe: 100*r.goalMetUnsafe.hard };
      for (const k of ['1','2','3']) {
        metrics['hardPassAt' + k] = 100*r.hardPassAtK[k];
        metrics['hardPassHat' + k] = 100*r.hardPassHatK[k];
      }
      if (!model?.label || !model.harness || !hard.tasks || ![hard.mean, hard.lo, hard.hi, r.hardCostPerTrial,
          ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Incomplete AutoFactory run');
      return { model: model.label, harness: model.harness, setting: model.servedVia, score: 100*hard.mean,
        low: 100*hard.lo, high: 100*hard.hi, trials: hard.trials / hard.tasks, cost: r.hardCostPerTrial, metrics };
    });
  },
};

export default board;
