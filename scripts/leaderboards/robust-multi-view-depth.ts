// Robust MVD tests depth estimates from multiple photographs. Table 2 gives mean absolute relative error across five datasets.
// The paper expresses relative error in percent. The importer converts it to a ratio for the catalog's score unit.
// It keeps the reported inlier percentages and mean runtime for each learned model and evaluation setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2209.06681';
const sets = ['KITTI', 'ScanNet', 'ETH3D', 'DTU', 'T&T'];
const settings: Record<string, string> = {
  'b)': 'Aligned depth without ground-truth poses or depth range',
  'c)': 'Ground-truth poses and depth range',
  'd)': 'Absolute scale with ground-truth poses',
};
const board: Leaderboard = {
  benchmark: 'robust-multi-view-depth', url: feed, feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: Object.fromEntries(sets.map(s => [s, s])),
  stats: { inlierRatio: { name: 'Average inlier ratio', unit: '%', better: 'higher' }, runtimeSeconds: { name: 'Runtime', unit: 'seconds', better: 'lower' }, ...Object.fromEntries(sets.map(s => [s + ' inlier ratio', { name: s + ' inlier ratio', unit: '%', better: 'higher' }])) },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Approach|GT|GT|Align|KITTI|KITTI|ScanNet|ScanNet|ETH3D|ETH3D|DTU|DTU|T&T|T&T|Average|Average|Average'
      && t[1]?.[14].includes('rel') && t[1]?.[15].includes('tau') && t[1]?.[16].includes('time [s]'));
    if (!table) throw Error('Missing Robust MVD Table 2');
    let group = '';
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      if (/^[a-d]\)$/.test(cells[0])) { group = cells[0]; continue; }
      if (group === 'a)') continue;
      if (!settings[group]) throw Error('Unknown Table 2 setting');
      const values = cells.slice(4).map(cell => {
        const raw = cell.replace(/^\(\s*|\s*\)$/g, '');
        if (!/^\d+(?:\.\d+)?$/.test(raw)) throw Error('Invalid Robust MVD result');
        return Number(raw);
      });
      if (values.length !== 13) throw Error('Missing Table 2 columns');
      const metrics: Record<string, number> = { inlierRatio: values[11], runtimeSeconds: values[12] };
      sets.forEach((s, i) => {
        metrics[s] = values[2*i] / 100;
        metrics[s + ' inlier ratio'] = values[2*i+1];
      });
      rows.push({ model: cells[0].replace(/\s*\[.*\]$/, ''), setting: settings[group], score: values[10] / 100, metrics });
    }
    return checked(rows, 24);
  },
};
export default board;
