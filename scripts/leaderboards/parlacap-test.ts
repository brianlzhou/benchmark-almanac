// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// ParlaCAP tests parliamentary topic classification. The repository reports macro and micro F1 for each language.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/TajaKuzman/Benchmarking-Text-Classification-on-South-Slavic/main/ParlaCAP-Topic-Benchmark/results/results.json';
const languages = { HR: 'Croatian', EN: 'English', RS: 'Serbian', BA: 'Bosnian' };
// The JSON includes two Croatian evaluations for each GPT-5 variant. The README identifies the published result.
const croatianMacro: Record<string, number> = { 'gpt-5': 0.691037, 'gpt-5-mini-2025-08-07': 0.677632, 'gpt-5-nano-2025-08-07': 0.605105 };
type Result = { Model: string, 'Test Dataset': string, 'Macro F1': number, 'Micro F1': number };
const board: Leaderboard = {
  benchmark: 'parlacap-test',
  url: 'https://github.com/TajaKuzman/Benchmarking-Text-Classification-on-South-Slavic/tree/main/ParlaCAP-Topic-Benchmark',
  feed, terms: 'The authors publish their results under the GitHub Terms of Service, https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  headline: 'The authors report no overall score, so this is the plain mean of macro F1 across four languages.',
  parts: languages,
  aliases: { 'gemma3:27b': 'gemma-3-27b', 'llama4:scout': 'llama-4-scout', 'llama3.3:latest': 'llama-3-3-70b-instruct',
    'qwen3:32b': 'qwen3-32b', 'deepseek-r1:14b': 'deepseek-r1-distill-qwen-14b', 'mistralai/mistral-medium-3.1': 'mistral-medium-3-1',
    'mistralai/mistral-small-3.2-24b-instruct': 'mistral-small-3-2', 'gpt-5-mini-2025-08-07': 'gpt-5-mini', 'gpt-5-nano-2025-08-07': 'gpt-5-nano' },
  async fetch() {
    const results = await fetchJson<Result[]>(feed);
    const models = new Map<string, Record<string, number>>();
    for (const row of results) {
      const model = row.Model;
      if (model.startsWith('dummy-')) continue;
      const language = /^ParlaCAP-([A-Z]+)-test$/.exec(row['Test Dataset'])?.[1];
      const macro = row['Macro F1'], micro = row['Micro F1'];
      if (!language || !(language in languages) || ![macro, micro].every(n => Number.isFinite(n) && n >= 0 && n <= 1))
        throw new Error('Invalid language or F1 values');
      if (language === 'HR' && model in croatianMacro && Number(macro.toFixed(6)) !== croatianMacro[model]) continue;
      const metrics = models.get(model) ?? {};
      if (language in metrics) throw new Error('Duplicate language for ' + model);
      metrics[language] = macro;
      metrics[language + 'MicroF1'] = micro;
      models.set(model, metrics);
    }
    const keys = Object.keys(languages);
    const rows = Array.from(models).filter(([, metrics]) => keys.every(k => k in metrics)).map(([model, metrics]) => ({
      model, metrics, score: keys.reduce((sum, k) => sum + metrics[k], 0) / keys.length,
    }));
    return checked(rows, 20);
  },
};
export default board;
