// The source reports no overall score. The headline is the plain mean of the 7 parts, computed by this importer.
// KnowMe-Bench tests memory, narrative reasoning and personal insight in long histories.
// Table 2 gives absolute task scores. Table 4 gives dataset-specific scores and deltas.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2601.04745';
const tasks = ['T1 Extract', 'T2 Abstain', 'T3 Temporal', 'T4 Order', 'T5 Trigger', 'T6 Mind–Body', 'T7 Principle'];
const datasets = ['Dataset 1 (Flashbacks)', 'Dataset 2 (Event Dense)', 'Dataset 3 (Mind)'];
const key = (dataset: string, task: string) => dataset + ': ' + task.replace('–', '-');
const parts = [...tasks.map(t => t.replace('–', '-')), ...datasets.flatMap(d => tasks.map(t => key(d, t)))];
export default {
  benchmark: 'knowme-bench', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2601.04745',
  headline: 'The paper reports no overall score, so the headline is the plain mean of the seven task scores.',
  parts: Object.fromEntries(parts.map(name => [name, {name, unit: 'score' as const}])),
  async fetch() {
    const html = await paperHtml(feed);
    const main = paperTables(html).map(grid).find(t => t[1]?.join('|') === ['System', ...tasks].join('|'));
    if (!main) throw new Error('Missing seven-task comparison');
    const rows: LeaderboardRow[] = [];
    let model = '';
    for (const [label, ...cells] of main.slice(2)) {
      if (label.startsWith('Backbone: ')) { model = label.slice(10); continue; }
      if (!model || cells.length !== tasks.length) throw new Error('Invalid backbone or task count');
      const scores = cells.map(cell => {
        const m = cell.match(/^(\d+\.\d+)(?: \([+-]\d+\.\d+\))?$/);
        if (!m) throw new Error('Invalid task score ' + cell);
        return Number(m[1]);
      });
      const harness = label === 'Base' ? undefined : label.replace(/^\+ /, '');
      rows.push({model, harness, score: scores.reduce((sum, s) => sum + s, 0) / tasks.length,
        metrics: Object.fromEntries(tasks.map((t, i) => [t.replace('–', '-'), scores[i]]))});
    }
    for (const dataset of datasets) {
      const start = html.indexOf(dataset + '</span>');
      const fragment = html.slice(start, html.indexOf('</table>', start) + 8);
      const block = paperTables(fragment)[0];
      if (start < 0 || !block) throw new Error('Missing ' + dataset);
      const table = grid(block);
      if (table[1]?.[1] !== 'T1 (Det.)' || table[1]?.[7] !== 'T7 (Sum.)') throw new Error('Missing subset columns');
      let base: number[] = [];
      for (const [label, ...cells] of table.slice(2)) {
        if (label.includes('Backbone: ')) { model = label.split('Backbone: ')[1]; base = []; continue; }
        const baseline = label.startsWith('Base Model');
        const harness = baseline ? undefined : label.replace(/^\+ /, '').replace(' (Entity)', '');
        const target = rows.find(r => r.model === model && r.harness === harness);
        if (!target?.metrics || cells.length !== 7 || cells.some(c => !/^[+-]?\d+\.\d+$/.test(c))) throw new Error('Invalid subset row: ' + label);
        if (baseline) base = cells.map(Number);
        if (base.length !== 7) throw new Error('Missing subset baseline');
        tasks.forEach((task, i) => { target.metrics![key(dataset, task)] = base[i] + (baseline ? 0 : Number(cells[i])); });
      }
    }
    return checked(rows, 17);
  },
} satisfies Leaderboard;
