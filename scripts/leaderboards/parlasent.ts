// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// ParlaSent tests sentiment classification on parliamentary speeches. The results JSON lists macro and micro F1
// on the English and BCS test sets and gives separate scores for each language.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'https://github.com/TajaKuzman/Benchmarking-Text-Classification-on-South-Slavic';
const feed = repo.replace('github.com', 'raw.githubusercontent.com') + '/main/ParlaSent-Benchmark/results/results.json';
const names = { en: 'English', sr: 'Serbian', bs: 'Bosnian', hr: 'Croatian', bcs: 'ParlaSent-BCS-test' };
const measures = ['Macro F1', 'Micro F1'] as const;
type Scores = Record<typeof measures[number],number>;
type Result = Scores & { Model: string; 'Test Dataset': string; 'Language-Specific Scores': Record<string,Scores> };
const board: Leaderboard = {
  benchmark: 'parlasent', url: repo + '/tree/main/ParlaSent-Benchmark', feed,
  terms: 'The authors publish results on GitHub under its terms (https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).',
  headline: 'The authors give no overall score, so this is the plain mean of macro F1 on the English and BCS test sets.',
  parts: Object.fromEntries(Object.entries(names).flatMap(([key,name]) =>
    measures.map(m => [key + m.replace(' ', ''), { name: name + ': ' + m, unit: 'score' }]))),
  aliases: { 'gemma3:27b': 'gemma-3-27b', 'deepseek-r1:14b': 'deepseek-r1-distill-qwen-14b',
    'llama3.3:latest': 'llama-3-3-70b-instruct', 'llama4:scout': 'llama-4-scout', 'qwen3:32b': 'qwen3-32b',
    'gpt-4o-2024-08-06': 'gpt-4o-aug-2024', 'gpt-4o-mini-2024-07-18': 'gpt-4o-mini',
    'gpt-5-mini-2025-08-07': 'gpt-5-mini', 'gpt-5-nano-2025-08-07': 'gpt-5-nano',
    'mistralai/mistral-medium-3.1': 'mistral-medium-3-1' },
  async fetch() {
    const results = await fetchJson<Result[]>(feed);
    const models = new Map<string,Record<string,number>>();
    for (const r of results) {
      if (r.Model.startsWith('dummy-')) continue;
      const metrics = models.get(r.Model) ?? {};
      models.set(r.Model, metrics);
      const bcs = r['Test Dataset'] === 'ParlaSent-BCS-test';
      if (!bcs && r['Test Dataset'] !== 'ParlaSent-EN-test') throw new Error('Unknown test set');
      for (const key of bcs ? ['bcs','sr','hr','bs'] : ['en']) {
        const source = key === 'bcs' || key === 'en' ? r : r['Language-Specific Scores'][key];
        for (const measure of measures) {
          const k = key + measure.replace(' ', '');
          if (k in metrics || !Number.isFinite(source?.[measure])) throw new Error('Invalid F1 for ' + r.Model);
          metrics[k] = source[measure];
        }
      }
    }
    const rows = [...models].filter(([,m]) => 'enMacroF1' in m && 'bcsMacroF1' in m)
      .map(([model,metrics]) => ({ model, metrics, score: (metrics.enMacroF1 + metrics.bcsMacroF1) / 2 }));
    return checked(rows, 18);
  },
};
export default board;
