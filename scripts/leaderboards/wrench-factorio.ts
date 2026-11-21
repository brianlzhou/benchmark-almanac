// WRENCH measures how well an agent detects and repairs Factorio factory disruptions.
// The source reports no overall score, so this importer uses the plain mean of its three task TR parts.
// It reads the published comparison table and omits rows missing a task score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://github.com/nicknjpconsultingllc/wrench-bench';
const feed = 'https://raw.githubusercontent.com/nicknjpconsultingllc/wrench-bench/main/table_runs/20260810T125411/results.md';
const board: Leaderboard = {
  benchmark: 'wrench-factorio', url, feed,
  headline: 'The source reports no overall score, so this is the plain mean of the three published task TR scores.',
  terms: 'The WRENCH repository publishes this results table under its MIT license. https://github.com/nicknjpconsultingllc/wrench-bench/blob/main/LICENSE',
  parts: {
    adaptive: { name: 'Iron plate adaptive sentinel', group: 'Task' },
    observability: { name: 'Iron plate observability sentinel', group: 'Task' },
    scarcity: { name: 'Iron plate scarcity sentinel', group: 'Task' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(feed);
    const start = text.indexOf('| Model | Task |');
    if (start < 0) throw new Error('WRENCH comparison table missing');
    const values = new Map<string, Record<string, number>>();
    for (const line of text.slice(start).split('\n').slice(2)) {
      const cells = line.split('|').map((v) => v.trim()).filter(Boolean);
      if (cells.length < 12 || !cells[0]) break;
      const tr = Number(cells[4]);
      if (!Number.isFinite(tr)) continue;
      const model = cells[0].replace(/^openrouter\/(?:anthropic|openai|google)\//, '');
      const task = cells[1].replace(/^iron_plate_/, '').replace(/_sentinel$/, '');
      const current = values.get(model) ?? {};
      current[task] = tr;
      values.set(model, current);
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of values) {
      if (!['adaptive', 'observability', 'scarcity'].every((key) => Number.isFinite(metrics[key]))) continue;
      rows.push({ model, score: (metrics.adaptive + metrics.observability + metrics.scarcity) / 3, metrics });
    }
    if (rows.length < 2) throw new Error('WRENCH complete model rows missing');
    return rows;
  },
};
export default board;
