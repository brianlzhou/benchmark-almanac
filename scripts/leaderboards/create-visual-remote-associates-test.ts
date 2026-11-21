// CREATE asks models to find a word connecting three photographs. The repeated-run summary gives mean accuracy
// on all 155 puzzles for each prompt, and accuracy on the 80 puzzles also presented to people.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/CeYang214/CREATEivity-benchmark/HEAD/experiments/results/repeated_runs/summary.json";
type Accuracy = { mean_accuracy: number; sample_standard_deviation: number };
type Result = { runs: unknown[]; aggregate: { all155: Accuracy; human80: Accuracy } };

const board: Leaderboard = {
  benchmark: "create-visual-remote-associates-test",
  url: "https://github.com/CeYang214/CREATEivity-benchmark/blob/main/experiments/results/repeated_runs/summary.json",
  feed,
  terms: "I found no reuse terms for the score file in the repository. The summary reports six models across five prompts and two puzzle sets. The host has no robots.txt.",
  parts: { human80: 'Human subset (80 puzzles)' },
  stats: {
    standardDeviation: { name: 'Standard deviation', unit: '%', better: 'lower' },
    human80StandardDeviation: { name: 'Human subset standard deviation', unit: '%', better: 'lower' },
  },
  async fetch() {
    const data = await fetchJson<Record<string, Record<string, Result>>>(feed);
    if (Object.keys(data).length < 6) throw new Error('Missing CREATE models');
    return Object.entries(data).flatMap(([model, settings]) => {
      if (Object.keys(settings).length < 5) throw new Error('Missing prompts for ' + model);
      return Object.entries(settings).map(([setting, result]) => {
        const { all155, human80 } = result.aggregate;
        const numbers = [all155.mean_accuracy, human80.mean_accuracy, all155.sample_standard_deviation, human80.sample_standard_deviation];
        if (!numbers.every(Number.isFinite) || result.runs.length < 5) throw new Error('Incomplete CREATE run');
        return { model, setting, score: all155.mean_accuracy * 100, trials: result.runs.length, metrics: {
          human80: human80.mean_accuracy * 100, standardDeviation: all155.sample_standard_deviation * 100,
          human80StandardDeviation: human80.sample_standard_deviation * 100,
        } };
      });
    });
  },
};
export default board;
