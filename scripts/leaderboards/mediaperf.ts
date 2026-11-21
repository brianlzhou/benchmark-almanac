// MediaPerf compares video tagging, summarization and tagging refinement on advertisements.
// The default table ranks core video tagging by macro F1. Read all workloads from the page's release bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const page = 'https://mediaperf.org/leaderboard';
interface Model { model: string; access: string; [field: string]: string | number | number[] | null }
interface Task { id: string; name: string; dataset: string; modelCount: number; models: Model[] }

const board: Leaderboard = {
  benchmark: 'mediaperf', url: page, feed: page + ' (current /assets/index-*.js bundle)',
  terms: 'MediaPerf allows the leaderboard in robots.txt and reserves rights without a separate score license.',
  headline: 'The default Video Tagging table ranks models by macro F1 on the 68 core tags.',
  aliases: { 'Nova Lite v2.0': 'nova-2-lite', 'Nova Pro v1.0': 'amazon-nova-pro',
    'Qwen3-VL-30B-A3B-Instruct-FP8': 'qwen3-vl-30b-a3b-instruct',
    'NVIDIA Nemotron 3 Nano Omni FP8': 'nemotron-3-nano-omni-30b-a3b' },
  parts: { t1: 'Video Tagging: Core dataset', t2: 'Video Tagging: Extended dataset', t3: 'Video Summarization: Core dataset' },
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
        const row = task.id === 't1' ? { model: entry.model, score: primary, setting: entry.model.endsWith('FP8') ? 'FP8' : undefined, open: entry.access === 'open', metrics: {} } : rows.get(entry.model);
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
