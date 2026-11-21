// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// PPE measures how often reward models and judges pick a preferred or correct answer.
// The Metrics Explorer's results.json gives accuracy over all examples in each dataset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const space = 'https://huggingface.co/spaces/lmarena-ai/preference-proxy-evaluations';
const feed = space + '/raw/main/results.json';
const datasets = { human_preference_v1: 'Human Preference', mmlu_pro_best_of_k: 'MMLU-Pro', math_best_of_k: 'MATH',
  gpqa_best_of_k: 'GPQA', mbpp_plus_best_of_k: 'MBPP+', ifeval_best_of_k: 'IFEval' };
const parts: Record<string, string> = { ...datasets };
const promptGroups = ['chinese_prompt', 'easy_prompt', 'english_prompt', 'hard_prompt', 'if_prompt', 'is_code',
  'math_prompt', 'non_english_prompt', 'russian_prompt', 'shorter_won', 'similar_response'];
const generators = ['Meta-Llama-3-8B-Instruct', 'claude-3-haiku-20240307', 'gemma-2-9b-it', 'gpt-4o-mini-2024-07-18'];
for (const [key, label] of Object.entries(datasets)) {
  for (const group of key === 'human_preference_v1' ? promptGroups : generators) {
    parts[key + '_' + group] = label + ': ' + group;
  }
}
type Feed = Record<string, Record<string, Record<string, Record<string, unknown>>>>;
const board: Leaderboard = {
  benchmark: 'preference-proxy-evaluations', url: space, feed, parts,
  headline: 'Plain mean of the six dataset-level accuracies.',
  terms: 'Arena publishes the results in its Hugging Face Space. https://huggingface.co/terms-of-service',
  aliases: { 'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet', 'gpt-4o-mini-2024-07-18': 'gpt-4o-mini' },
  async fetch() {
    const input = await fetchJson<Feed>(feed);
    const models = new Map<string, LeaderboardRow>();
    for (const key of Object.keys(datasets)) {
      if (!input[key]) throw new Error('Missing dataset ' + key);
      for (const [file, breakdown] of Object.entries(input[key])) {
        const name = file.split('/').at(-1)!.replace(/\.jsonl?$/, '');
        if (name === 'NaiveVerbosityModel') continue;
        const judge = name.match(/^(alpaca-eval|arena-hard)-(.+)$/);
        const row = models.get(name) ?? { model: judge?.[2] ?? name, harness: judge?.[1], score: 0, metrics: {} };
        const aggregate = key === 'human_preference_v1' ? 'overall' : 'all';
        const accuracy = breakdown[aggregate]?.accuracy;
        if (typeof accuracy !== 'number' || !Number.isFinite(accuracy)) throw new Error('Invalid dataset accuracy');
        row.metrics![key] = 100 * accuracy;
        for (const [group, values] of Object.entries(breakdown)) {
          if (group === aggregate) continue;
          if (!(key + '_' + group in parts)) throw new Error('Undeclared subgroup ' + group);
          if (typeof values.accuracy === 'number') row.metrics![key + '_' + group] = 100 * values.accuracy;
        }
        models.set(name, row);
      }
    }
    const keys = Object.keys(datasets);
    return checked([...models.values()].filter(row => keys.every(k => k in row.metrics!)).map(row =>
      ({ ...row, score: keys.reduce((a, k) => a + row.metrics![k], 0) / keys.length })), 19);
  },
};
export default board;
