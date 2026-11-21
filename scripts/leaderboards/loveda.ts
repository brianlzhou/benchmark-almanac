// LoveDA tests satellite-image segmentation across seven land-cover classes in urban and rural areas.
// Table 2 reports mean intersection over union on the full test set, class IoU and inference speed.
// Table 3 adds multi-scale training and testing settings for four architectures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2110.08733';
const classes = ['Background', 'Building', 'Road', 'Water', 'Barren', 'Forest', 'Agriculture'];
const board: Leaderboard = {
  benchmark: 'loveda', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  parts: Object.fromEntries(classes.map(name => [name, name])),
  stats: { fps: { name: 'Inference speed', unit: 'count', better: 'higher', note: 'Inference speed in frames per second.' } },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(url)).map(grid);
    const main = tables.find(t => t[1]?.join('|') === ['Method', 'Backbone', ...classes, 'mIoU (%)', 'Speed (FPS)'].join('|'));
    const aug = tables.find(t => t[1]?.join('|') === 'Method|Baseline|+MSTr|+MSTrTe');
    if (!main || !aug) throw new Error('Missing LoveDA segmentation tables');
    const rows: LeaderboardRow[] = main.slice(2).map(row => ({
      model: row[0].replace(/\s*\[\s*\d+\s*\]$/, ''), setting: row[1], score: numberCell(row[9]),
      metrics: {fps: numberCell(row[10]), ...Object.fromEntries(classes.map((c, i) => [c, numberCell(row[2 + i])]))},
    }));
    for (const [label, , train, both] of aug.slice(2)) {
      const baseline = rows.find(r => r.model === (label === 'SFPN' ? 'Semantic-FPN' : label));
      if (!baseline) throw new Error('Unknown architecture ' + label);
      rows.push({model: baseline.model, setting: baseline.setting + ', multi-scale training', score: numberCell(train)},
        {model: baseline.model, setting: baseline.setting + ', multi-scale training and testing', score: numberCell(both)});
    }
    return checked(rows, 19);
  },
};
export default board;
