// English Proverbs asks models to choose the proverb that fits a story.
// The BIG-bench repository publishes multiple-choice accuracy by shot count and temperature in individual score files.
import type { Leaderboard } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
interface Result {
  model: { model_family: string; model_name: string; decoding_params?: { temperature?: number }; total_params?: number };
  scores: { number_of_shots: number; preferred_score: string; subtask_description: string; score_dict: Record<string, number> }[];
}

const FEED = "https://github.com/google/BIG-bench/tree/main/bigbench/benchmark_tasks/english_proverbs/results";
const board: Leaderboard = {
  benchmark: "big-bench-english-proverbs",
  url: "https://github.com/google/BIG-bench/tree/main/bigbench/benchmark_tasks/english_proverbs/results",
  feed: FEED,
  terms: "The directory contains 51 score files for 39 model variants after collapsing temperature settings. The repository license is Apache 2.0. https://github.com/google/BIG-bench/blob/main/LICENSE GitHub lists crawl limits and the raw file host has no robots.txt.",
  stats: { calibration_multiple_choice_brier_score: { name: 'Calibration multiple-choice Brier score', unit: 'brier', better: 'lower' }, expected_calibration_error: { name: 'Expected calibration error', unit: 'score', better: 'lower' }, normalized_aggregate_score: { name: 'Normalized aggregate score', unit: 'score', better: 'higher' }, weighted_log_probabilities: { name: 'Weighted log probabilities', unit: 'score', better: 'higher' }, weighted_probabilities: { name: 'Weighted probabilities', unit: 'score', better: 'higher' } },
  async fetch() {
    const index = await fetchText(FEED);
    const files = new Set([...index.matchAll(/"path":"(bigbench\/benchmark_tasks\/english_proverbs\/results\/scores_[^"/]+\.json)"/g)].map(m => m[1]));
    if (files.size < 51) throw new Error('Expected at least 51 English Proverbs score files');
    const rows = [];
    for (const file of files) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const link = 'https://raw.githubusercontent.com/google/BIG-bench/main/' + file;
      const { model, scores } = await fetchJson<Result>(link);
      const headline = scores.filter(s => s.subtask_description === 'english_proverbs');
      if (!model.model_name || !headline.length) throw new Error('Missing model or scores in ' + file);
      for (const s of headline) {
        const value = s.score_dict.multiple_choice_grade;
        if (s.preferred_score !== 'multiple_choice_grade' || !Number.isFinite(value)) throw new Error('Missing preferred score in ' + file);
        const { multiple_choice_grade, ...metrics } = s.score_dict;
        const name = model.model_name.startsWith(model.model_family) ? model.model_name : model.model_family + ' ' + model.model_name;
        const temperature = model.decoding_params?.temperature;
        rows.push({ model: name, score: 100 * value, link, metrics,
          setting: s.number_of_shots + '-shot' + (temperature == null ? '' : ', temperature ' + temperature),
          params: model.total_params ? model.total_params / 1e9 : undefined });
      }
    }
    return rows;
  },
};
export default board;
