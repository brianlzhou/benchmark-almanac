// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// Mementos tests descriptions of image sequences. Table 2 gives object and behavior F1 for three domains as percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2401.10529';
const board: Leaderboard = {
  benchmark: 'mementos', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2401.10529.',
  headline: 'The paper reports no overall score, so this is the plain mean of object and behavior F1 across three domains, in percent.',
  parts: Object.fromEntries(['Daily-life','Robotics','Comics'].flatMap(d => ['Object Recall','Object Precision','Object F1','Behavior Recall','Behavior Precision','Behavior F1'].map(m => [d.replace('-','') + m.replace(' ',''), {name:d+' '+m, unit:'%'}]))),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === 'Domain|Input type|Model|Recall|Precision|F1|Recall|Precision|F1');
    if (!table) throw new Error('Missing Mementos results');
    const body = table.slice(2);
    const labels = body.flatMap((r, i) => r[0] ? [{domain: r[0], center: i}] : []);
    if (labels.map(l => l.domain).join('|') !== 'Daily-life|Robotics|Comics' || body.length !== 36) throw new Error('Unexpected Mementos domain groups');
    const runs = new Map<string, LeaderboardRow>();
    for (const [i, [domainLabel, setting, model, ...cells]] of body.entries()) {
      const { domain, center } = labels[Math.floor(i / 12)];
      if (center !== Math.floor(i / 12) * 12 + 5 || (domainLabel && domainLabel !== domain)) throw new Error('Domain label moved');
      const id = JSON.stringify([setting, model]);
      const row = runs.get(id) ?? {model, setting, score: 0, metrics: {}};
      for (const [j, name] of ['Object Recall', 'Object Precision', 'Object F1', 'Behavior Recall', 'Behavior Precision', 'Behavior F1'].entries()) {
        const key = domain.replace('-', '') + name.replace(' ', '');
        if (!cells[j]?.endsWith('%') || key in row.metrics!) throw new Error('Unexpected Mementos metric');
        row.metrics![key] = numberCell(cells[j].slice(0, -1).replace(',', '.'));
        if (name.endsWith('F1')) {
          board.parts![key] = {name: domain + ' ' + name, unit: '%'};
          row.score += row.metrics![key] / 6;
        }
      }
      runs.set(id, row);
    }
    const rows = [...runs.values()].filter(row => Object.keys(row.metrics!).length === 18);
    return checked(rows, 12);
  },
};
export default board;
