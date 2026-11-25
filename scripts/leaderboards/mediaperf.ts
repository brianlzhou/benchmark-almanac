// MediaPerf compares video tagging, summarization and tagging refinement on advertisements.
// The default table ranks core video tagging by macro F1. Read all workloads from the page's release bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const page = 'https://mediaperf.org/leaderboard';
interface Model { model: string; access: string; [field: string]: string | number | number[] | null }
interface Task { id: string; name: string; dataset: string; modelCount: number; models: Model[] }

const mediaStatDefinitions: Record<string, { name: string; unit: string; better?: 'higher' | 'lower'; note?: string }> = {
  precision: { name: 'Precision', unit: 'score', better: 'higher', note: 'Precision is stored from 0 to 1.' },
  recall: { name: 'Recall', unit: 'score', better: 'higher', note: 'Recall is stored from 0 to 1.' },
  f1: { name: 'F1', unit: 'score', better: 'higher', note: 'F1 is stored from 0 to 1.' },
  scoreMean: { name: 'Mean summary score', unit: 'score', better: 'higher' },
  scoreMedian: { name: 'Median summary score', unit: 'score', better: 'higher' },
  preprocessingCost: { name: 'Preprocessing cost', unit: 'usd', better: 'lower' },
  inferenceCost: { name: 'Inference cost', unit: 'usd', better: 'lower' },
  totalCost: { name: 'Total cost', unit: 'usd', better: 'lower' },
  ingestionCost: { name: 'Ingestion cost', unit: 'usd', better: 'lower' },
  costPerHour: { name: 'Cost per hour', unit: 'usd', better: 'lower' },
  preprocessingHours: { name: 'Preprocessing time', unit: 'hours', better: 'lower' },
  inferenceHours: { name: 'Inference time', unit: 'hours', better: 'lower' },
  totalLatencyHours: { name: 'Total latency', unit: 'hours', better: 'lower' },
  throughput: { name: 'Throughput', unit: 'count', note: 'Throughput is stored in the source table unit.' },
  inferenceCostRounds1: { name: 'Inference cost for round 1', unit: 'usd', better: 'lower' },
  inferenceCostRounds2: { name: 'Inference cost for round 2', unit: 'usd', better: 'lower' },
  inferenceCostRounds3: { name: 'Inference cost for round 3', unit: 'usd', better: 'lower' },
  inferenceCostRounds4: { name: 'Inference cost for round 4', unit: 'usd', better: 'lower' },
  inferenceCostRounds5: { name: 'Inference cost for round 5', unit: 'usd', better: 'lower' },
  inferenceHoursRounds1: { name: 'Inference time for round 1', unit: 'hours', better: 'lower' },
  inferenceHoursRounds2: { name: 'Inference time for round 2', unit: 'hours', better: 'lower' },
  inferenceHoursRounds3: { name: 'Inference time for round 3', unit: 'hours', better: 'lower' },
  inferenceHoursRounds4: { name: 'Inference time for round 4', unit: 'hours', better: 'lower' },
  inferenceHoursRounds5: { name: 'Inference time for round 5', unit: 'hours', better: 'lower' },
};
const mediaTaskFields: Record<string, string[]> = {
  t1: ['precision', 'recall', 'f1', 'preprocessingCost', 'inferenceCost', 'totalCost', 'costPerHour', 'preprocessingHours', 'inferenceHours', 'totalLatencyHours', 'throughput', 'ingestionCost'],
  t2: ['precision', 'recall', 'f1', 'preprocessingCost', 'inferenceCost', 'totalCost', 'costPerHour', 'preprocessingHours', 'inferenceHours', 'totalLatencyHours', 'throughput', 'ingestionCost'],
  t3: ['scoreMean', 'scoreMedian', 'preprocessingCost', 'inferenceCost', 'totalCost', 'costPerHour', 'preprocessingHours', 'inferenceHours', 'totalLatencyHours', 'throughput', 'ingestionCost'],
  t4: ['preprocessingCost', 'inferenceCostRounds1', 'inferenceCostRounds2', 'inferenceCostRounds3', 'inferenceCostRounds4', 'inferenceCostRounds5', 'totalCost', 'preprocessingHours', 'inferenceHoursRounds1', 'inferenceHoursRounds2', 'inferenceHoursRounds3', 'inferenceHoursRounds4', 'inferenceHoursRounds5', 'totalLatencyHours', 'ingestionCost'],
};
const mediaStats = Object.fromEntries(Object.entries(mediaTaskFields).flatMap(([task, fields]) => fields.map(field => {
  const label = task === 't1' ? 'Video tagging core' : task === 't2' ? 'Video tagging extended' : task === 't3' ? 'Video summarization core' : 'Tagging refinement';
  const definition = mediaStatDefinitions[field];
  return [`${task}.${field}`, { ...definition, name: `${label} ${definition.name.toLowerCase()}` }];
})));

const board: Leaderboard = {
  benchmark: 'mediaperf', url: page, feed: page + ' (current /assets/index-*.js bundle)', costPer: 'run',
  terms: 'MediaPerf allows the leaderboard in robots.txt and reserves rights without a separate score license.',
  headline: 'The default Video Tagging table ranks models by macro F1 on the 68 core tags.',
  aliases: { 'Nova Lite v2.0': 'nova-2-lite', 'Nova Pro v1.0': 'amazon-nova-pro',
    'Qwen3-VL-30B-A3B-Instruct-FP8': 'qwen3-vl-30b-a3b-instruct',
    'NVIDIA Nemotron 3 Nano Omni FP8': 'nemotron-3-nano-omni-30b-a3b' },
  parts: { t1: 'Video Tagging: Core dataset', t2: 'Video Tagging: Extended dataset', t3: 'Video Summarization: Core dataset' },
  stats: mediaStats,
  chart: { title: 'Quality vs. Cost', x: { key: 't1.costPerHour', label: 'Cost per hour of video', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'F1 (macro)' } },
  async fetch() {
    const html = await fetchText(page);
    const path = html.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!path) throw new Error('MediaPerf: release bundle missing');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const source = await fetchText(new URL(path, page).href);
    const start = source.search(/\{version:"v\.[^"]+",releaseDate:"[^"]+",videos:\d+,minutes:\d+,tasks:\[/);
    if (start < 0) throw new Error('MediaPerf: release data missing');
    const literal = source.slice(start).replace(/([:,\[])(-?)\.(\d)/g, '$1$20.$3');
    const { tasks } = jsLiteral<{tasks: Task[]}>(literal, 0);
    const rows = new Map<string, LeaderboardRow>();
    if (tasks.map(t => t.id).join() !== 't1,t2,t3,t4') throw new Error('MediaPerf: task list changed');
    for (const task of tasks) {
      if (task.models.length !== task.modelCount) throw new Error('Incomplete MediaPerf table: ' + task.name);
      for (const entry of task.models) {
        const primary = entry[task.id === 't3' ? 'scoreMean' : task.id === 't4' ? 'totalCost' : 'f1'];
        if (!entry.model || typeof primary !== 'number') throw new Error('Missing MediaPerf result on ' + task.name);
        const cost = task.id === 't1' && typeof entry.totalCost === 'number' && Number.isFinite(entry.totalCost) ? entry.totalCost : undefined;
        const row = task.id === 't1' ? { model: entry.model, score: primary, setting: entry.model.endsWith('FP8') ? 'FP8' : undefined, open: entry.access === 'open', cost, metrics: {} } : rows.get(entry.model);
        if (!row) throw new Error('No core score for ' + entry.model);
        const metrics: Record<string, number> = row.metrics!;
        if (task.id !== 't4') metrics[task.id] = primary;
        for (const [field, value] of Object.entries(entry)) {
          if (typeof value === 'number') metrics[task.id + '.' + field] = value;
          if (Array.isArray(value)) value.forEach((v, i) => { metrics[task.id + '.' + field + (i + 1)] = v; });
        }
        rows.set(entry.model, row);
      }
    }
    if (rows.size < 17) throw new Error('MediaPerf: expected at least 17 models');
    return [...rows.values()];
  },
};
export default board;
