// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Coverage Cat tests document reading, fact discovery and permitted insurance workflows on fictional cases.
// The JSON holds both the original cohort and the extension. Each primary track counts every scheduled attempt.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.coveragecat.com/ai/leaderboard';
const feed = url + '/research.json';
const parts = { source_qa: 'Read documents', discovery: 'Find missing facts', workflow: 'Complete a workflow' };
type Model = { model_id: string, reasoning: string, quantization: string | null };
type Track = { model_id: string, track: string, success_rate: number, success_interval: number[],
  successes: number, scheduled: number, recorded_candidate_cost_usd?: number, median_call_ms?: number };
type Cohort = { models: Model[], tracks: Track[] };
const board: Leaderboard = {
  benchmark: 'coverage-cat-fictional-insurance', url, feed, parts, costPer: 'run',
  terms: 'Coverage Cat publishes aggregate results under its site terms. https://www.coveragecat.com/terms-of-service',
  async fetch() {
    const data = await fetchJson<Cohort & { cohort: { trials: number }, publication: {
      model_extension_v1: { models: Model[], primary: { tracks: Track[] } } } }>(feed);
    const extension = data.publication.model_extension_v1;
    const cohorts = [data, { models: extension.models, tracks: extension.primary.tracks }];
    const rows = cohorts.flatMap(cohort => cohort.models.map(({ model_id, reasoning, quantization }) => {
      const tracks = cohort.tracks.filter(track => track.model_id === model_id);
      const metrics: Record<string, number> = {};
      if (tracks.length !== 3 || Object.keys(parts).some(k => !tracks.some(t => t.track === k)))
        throw new Error('Missing primary track for ' + model_id);
      for (const t of tracks) {
        const [lo, hi] = t.success_interval;
        if (![lo, hi, t.success_rate].every(v => Number.isFinite(v) && v >= 0 && v <= 1)
            || Math.abs(t.success_rate - t.successes / t.scheduled) > 0.00001) throw new Error('Invalid track score');
        metrics[t.track] = t.success_rate * 100;
        metrics[t.track + 'Low'] = lo * 100;
        metrics[t.track + 'High'] = hi * 100;
        metrics[t.track + 'Scheduled'] = t.scheduled;
        metrics[t.track + 'Successes'] = t.successes;
        if (Number.isFinite(t.median_call_ms)) metrics[t.track + 'MedianCallMs'] = t.median_call_ms!;
      }
      const score = (metrics.source_qa + metrics.discovery + metrics.workflow) / 3;
      const cost = tracks.every(t => Number.isFinite(t.recorded_candidate_cost_usd))
        ? tracks.reduce((sum, t) => sum + t.recorded_candidate_cost_usd!, 0) : undefined;
      const setting = [reasoning.replace('_', ' ') + ' reasoning', quantization === 'unknown' ? null : quantization]
        .filter(Boolean).join(', ');
      return { model: model_id, score, metrics, trials: data.cohort.trials, setting, cost };
    }));
    return checked(rows, 12);
  },
};
export default board;
