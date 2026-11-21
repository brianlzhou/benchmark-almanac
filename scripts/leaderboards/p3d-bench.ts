// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// P3D-Bench tests parametric 3D generation. Its board gives each task a score and cost per generation.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://spatiaos.github.io/projects/P3D-Bench/';
interface Group { label: string; span: number }
interface Task {
  key: string; title: string; groups: Group[]; superGroups?: Group[]; metrics: string[];
  rows: { model: string; cells: string }[];
}
const expand = (groups: Group[]) => groups.flatMap(g => Array<string>(g.span).fill(g.label));
const board: Leaderboard = {
  benchmark: 'p3d-bench', url, feed: url,
  headline: 'The board reports no overall score, so the headline is the plain mean of its three task scores.',
  terms: 'The project publishes its code under MIT and credits the upstream dataset licenses at https://github.com/SpatiaOS/P3D-Bench#license.',
  async fetch() {
    const html = await fetchText(url);
    const asset = html.match(/src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!asset) throw new Error('Missing leaderboard bundle');
    const bundle = await fetchText(new URL(asset, url).href);
    const encoded = bundle.match(/(\[\{"key":"assembly","title".*?"key":"image","title".*?\}\])(?=;)/)?.[1];
    if (!encoded) throw new Error('Missing leaderboard tables');
    const tasks: Task[] = JSON.parse(encoded);
    if (tasks.map(t => t.key).join() !== 'assembly,text,image') throw new Error('Task columns changed');
    const parts: Record<string, BoardPart> = {};
    const models = new Map<string, Record<string, number>>();
    for (const task of tasks) {
      if (task.metrics[0] !== 'Score' || task.metrics[1] !== 'USD / generation') throw new Error('Missing score or cost');
      const groups = expand(task.groups);
      const superGroups = expand(task.superGroups ?? []);
      if (groups.length !== task.metrics.length) throw new Error('Metric groups changed');
      parts[task.key] = { name: task.title, group: 'Task' };
      const seen = new Set<string>();
      for (const { model, cells } of task.rows) {
        if (seen.has(model)) throw new Error('Duplicate model in ' + task.title);
        seen.add(model);
        const fields = cells.split(/\s+/);
        if (fields.length !== task.metrics.length) throw new Error('Column count changed');
        const metrics = models.get(model) ?? {};
        fields.forEach((field, i) => {
          if (field === '-') return;
          const value = Number(field.replace(/^\$/, ''));
          if (!Number.isFinite(value)) throw new Error('Invalid value in ' + cells);
          const key = i === 0 ? task.key : task.key + i;
          metrics[key] = value;
          if (i > 1) parts[key] = { name: [superGroups[i], groups[i], task.metrics[i]].filter(Boolean).join(' '), group: task.title,
            unit: task.metrics[i] === 'Valid (%)' ? '%' : 'score' };
        });
        models.set(model, metrics);
      }
    }
    board.parts = parts;
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of models) {
      if (!tasks.every(t => t.key in metrics)) continue;
      rows.push({ model, metrics, score: (metrics.assembly + metrics.text + metrics.image) / 3,
        cost: (metrics.assembly1 + metrics.text1 + metrics.image1) / 3 });
    }
    return checked(rows, 9);
  },
};
export default board;
