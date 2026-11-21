// Q-Bench tests low-level visual perception, description and quality assessment.
// The official Space publishes single-image test accuracy, description ratings and quality correlations in separate CSV files.
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import type { Leaderboard } from './types.ts';
const url = 'https://huggingface.co/spaces/q-future/Q-Bench-Leaderboard';
const base = url + '/raw/main/';
const feed = base + 'qbench_a1_single_test.csv';
const perception = ['Yes-or-No','What','How','Distortion','Other','In-context Distortion','In-context Other'];
const description = ['Completeness','Precision','Relevance','Sum'];
const assessment = ['KONiQ-10k','SPAQ','LIVE-FB','LIVE-ITW','CGIQA-6K','AGIQA-3K'];
const board: Leaderboard = {
  benchmark: 'q-bench', url, feed, terms: 'The Space uses Apache-2.0. ' + url + '/blob/main/README.md',
  headline: 'Q-Bench reports separate measures for its three tasks. The headline is overall single-image perception accuracy on the test set.',
  aliases: {'Emu2-Chat (LLaMA-33B)': 'emu2-chat', 'Fuyu-8B (Persimmon-8B)': 'fuyu-8b',
    'mPLUG-Owl2 (LLaMA-7B)': 'mplug-owl2-llama2-7b', 'LLaVA-v1.5 (Vicuna-v1.5-7B)': 'llava-v1-5-7b',
    'LLaVA-v1.5 (Vicuna-v1.5-13B)': 'llava-v1-5-13b', 'IDEFICS-Instruct (LLaMA-7B)': 'idefics-9b-instruct',
    'Qwen-VL-Plus (Close-Source)': 'qwen-vl-plus', 'Qwen-VL-Max (Close-Source)': 'qwen-vl-max'},
  parts: {...Object.fromEntries(perception.map(name => [name, {name, group: 'Perception'}])),
    ...Object.fromEntries(description.map(name => [name, {name, group: 'Description', unit: 'score' as const}])),
    ...Object.fromEntries(assessment.flatMap(dataset => ['SRCC','PLCC'].map(metric => {
      const name = dataset + ' ' + metric;
      return [name, {name, group: 'Quality assessment', unit: 'score' as const}];
    })))},
  async fetch() {
    const main = parseCsv(await fetchText(feed));
    const extras = new Map<string, Record<string, number>>();
    for (const r of parseCsv(await fetchText(base + 'qbench_a2_single.csv'))) {
      extras.set(r.Model, Object.fromEntries(description.map(key => [key, numberCell(r[key])])));
    }
    for (const r of parseCsv(await fetchText(base + 'qbench_a3_single.csv'))) {
      const metrics = extras.get(r.Model) ?? {};
      for (const dataset of assessment) {
        const [srcc, plcc] = r[dataset].split('/').map(numberCell);
        if (!Number.isFinite(plcc)) throw new Error('Missing correlation for ' + r.Model);
        metrics[dataset + ' SRCC'] = srcc;
        metrics[dataset + ' PLCC'] = plcc;
      }
      extras.set(r.Model, metrics);
    }
    return checked(main.map(r => {
      const model = r['Model (variant)'];
      return {model, score: numberCell(r.Overall), metrics: {...extras.get(model),
        ...Object.fromEntries(perception.map(key => [key, numberCell(r[key])]))}};
    }), 25);
  },
};
export default board;
