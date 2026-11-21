// CAPR-ar scores the exact proverb choice for each Arabic scenario.
// The official test report records the fraction correct, strategy and invalid answers for every model.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/AhmedHajAhmed/adage-benchmark/main/results_ar/evaluation_report.json";
const board: Leaderboard = {
  benchmark: "capr-ar",
  url: "https://github.com/AhmedHajAhmed/adage-benchmark/blob/main/results_ar/evaluation_report.json",
  feed,
  terms: "The makers release their code and derived data under the MIT license. The raw file host has no robots.txt.",
  async fetch() {
    type Result = { model: string; strategy: string; accuracy: number; n_correct: number; n_invalid: number; n_items: number };
    const data = await fetchJson<{ benchmark: string; split: string; models: Result[] }>(feed);
    if (data.benchmark !== 'ar_proverb_mcq' || data.split !== 'test' || data.models.length < 14) throw new Error('Incomplete CAPR-ar test report');
    return data.models.map(r => {
      if (!r.model || !r.strategy || ![r.accuracy, r.n_correct, r.n_invalid, r.n_items].every(Number.isFinite)) throw new Error('Incomplete proverb result');
      return { model: r.model, setting: r.strategy, score: 100 * r.accuracy, metrics: { correct: r.n_correct, invalid: r.n_invalid, items: r.n_items } };
    });
  },
};
export default board;
