// CAPR-am tests proverb selection for Amharic scenarios. The test report gives accuracy for each model and strategy.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Row { model: string; strategy: string; accuracy: number; n_correct: number; n_items: number; n_invalid: number }

const feed = "https://raw.githubusercontent.com/AhmedHajAhmed/adage-benchmark/main/results_am/evaluation_report.json";
const board: Leaderboard = {
  benchmark: 'capr-am',
  url: "https://github.com/AhmedHajAhmed/adage-benchmark/blob/main/results_am/evaluation_report.json",
  feed,
  terms: "The raw file host has no robots.txt. The makers release their code and derived data under the MIT license. https://github.com/AhmedHajAhmed/adage-benchmark/blob/main/LICENSE",
  async fetch() {
    const data = await fetchJson<{ benchmark: string; split: string; models: Row[]; leaderboard: Row[] }>(feed);
    if (data.benchmark !== 'am_proverb_mcq' || data.split !== 'test' || data.models.length < 14 ||
        data.models.length !== data.leaderboard.length) throw new Error('Incomplete CAPR-am test results');
    return data.models.map(r => {
      if (!r.model || !r.strategy || ![r.accuracy, r.n_correct, r.n_items, r.n_invalid].every(Number.isFinite))
        throw new Error('Incomplete CAPR-am entry');
      return { model: r.model, setting: r.strategy, score: r.accuracy * 100,
        metrics: { correct: r.n_correct, items: r.n_items, invalid: r.n_invalid } };
    });
  },
};
export default board;
