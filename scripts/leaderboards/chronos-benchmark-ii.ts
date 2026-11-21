// Chronos Benchmark II measures forecasting error on 27 datasets. The official fev files name MASE
// as the evaluation metric and WQL as a second metric. Each is normalized to Seasonal Naive per dataset.
// “The relative scores are aggregated across all datasets using the geometric mean.”
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const path = 'autogluon/fev/contents/benchmarks/chronos_zeroshot/results';
const feed = 'https://api.github.com/repos/' + path;
const board: Leaderboard = {
  benchmark: 'chronos-benchmark-ii', url: 'https://github.com/autogluon/fev/tree/main/benchmarks/chronos_zeroshot/results', feed,
  terms: 'Apache License 2.0. https://github.com/autogluon/fev/blob/main/LICENSE',
  stats: {
    relativeWQL: { name: 'Relative weighted quantile loss', unit: 'score', better: 'lower' },
    inferenceSeconds: { name: 'Inference time', unit: 'seconds', better: 'lower' },
    trainingOverlapDatasets: { name: 'Training-overlap datasets', unit: 'count' },
  },
  async fetch() {
    const files = await fetchJson<{name:string,download_url:string}[]>(feed);
    const all = new Map<string, Map<string,Record<string,string>>>();
    for (const file of files.filter(f => f.name.endsWith('.csv'))) {
      await new Promise(resolve => setTimeout(resolve,1000));
      const data = parseCsv(await fetchText(file.download_url));
      const tasks = new Map(data.map(r => [r.dataset_config,r]));
      if (data.length !== 27 || tasks.size !== 27 || data.some(r => !r.model_name || r.model_name !== data[0].model_name || r.eval_metric !== 'MASE')) throw new Error('Incomplete results in ' + file.name);
      all.set(data[0].model_name,tasks);
    }
    const baseline = all.get('seasonal_naive');
    if (!baseline) throw new Error('Missing Seasonal Naive reference');
    board.parts = {};
    const rows: LeaderboardRow[] = [];
    for (const [model,tasks] of all) {
      if (model === 'seasonal_naive') continue;
      const metrics: Record<string,number> = {};
      const logSums = {MASE:0,WQL:0};
      let trainingOverlap = 0, inferenceSeconds = 0;
      for (const [dataset,reference] of baseline) {
        const r = tasks.get(dataset);
        if (!r || !r.inference_time_s || !Number.isFinite(Number(r.inference_time_s))) throw new Error('Missing task or inference time for ' + model);
        if (r.trained_on_this_dataset === 'True') trainingOverlap++;
        inferenceSeconds += Number(r.inference_time_s);
        for (const metric of ['MASE','WQL'] as const) {
          const value = Number(r[metric]), denom = Number(reference[metric]);
          if (!(value > 0 && denom > 0 && Number.isFinite(value/denom))) throw new Error('Invalid forecast error for ' + dataset);
          logSums[metric] += Math.log(value/denom);
          const name = dataset + ': ' + metric;
          metrics[name] = value;
          board.parts[name] = { name, unit: 'score', better: 'lower', note: 'Dataset error before normalization' };
        }
      }
      metrics.relativeWQL = Math.exp(logSums.WQL / tasks.size);
      metrics.inferenceSeconds = inferenceSeconds;
      metrics.trainingOverlapDatasets = trainingOverlap;
      rows.push({model, score: Math.exp(logSums.MASE / tasks.size), metrics});
    }
    return checked(rows,20);
  },
};
export default board;
