// CorporateBench tests extraction, classification and question answering over corporate archives.
// Fireworks reports the average of three runs, weighting every company and capability equally.
import type { Leaderboard } from './types.ts';
import { fireworksBoard } from '../lib/boards/fireworks.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const id = 'legal/epiq-laer-corporatebench';
const source = fireworksBoard('corporatebench', id);
type Run = {model: string, metrics: Record<string, {value: number, unit: string}>, per_run_scores: number[],
  raw: {reasoning: string, ci: {lo: number, hi: number, runs: number}}};
const board: Leaderboard = {
  ...source, host: 'Fireworks AI',
  stats: { run1: { name: 'Run 1 score', unit: '%', better: 'higher' }, run2: { name: 'Run 2 score', unit: '%', better: 'higher' }, run3: { name: 'Run 3 score', unit: '%', better: 'higher' }, secondsPerTask: { name: 'Duration per task', unit: 'seconds', better: 'lower' } },
  terms: 'Fireworks publishes these Epiq evaluations under https://fireworks.ai/terms-of-service.',
  async fetch() {
    const data = await fetchJson<{benchmarks: {id: string, result_count: number, headline_metric: {unit: string, key: string}, results: Run[]}[]}>(source.feed);
    const b = data.benchmarks.find(b => b.id === id);
    if (b?.headline_metric.key !== 'acc' || b.headline_metric.unit !== 'percent' || b.results.length !== b.result_count) throw new Error('Unexpected CorporateBench results');
    return checked(b.results.map(r => {
      const {lo,hi,runs} = r.raw.ci;
      if (r.metrics.cost_per_task.unit !== 'USD' || runs !== r.per_run_scores.length) throw new Error('Unexpected run statistics');
      return {model: r.model, setting: r.raw.reasoning, score: r.metrics.score.value,
        low: lo, high: hi, trials: runs, cost: r.metrics.cost_per_task.value,
        metrics: {secondsPerTask: r.metrics.duration_per_task.value,
          ...Object.fromEntries(r.per_run_scores.map((v,i) => ['run' + (i+1),v]))}};
    }), 13);
  },
};
export default board;
