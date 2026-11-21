// LVOS v2 tests segmentation across long video sequences. The headline is test J&F.
// Tables III to V and VIII to X compare the semi-supervised, unsupervised single-object
// and unsupervised multiple-object protocols before and after training on LVOS.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2404.19326';
const tables = [
  ['S3.T3', 'Semi-supervised'], ['S3.T4', 'Unsupervised single object'], ['S3.T5', 'Unsupervised multiple objects'],
  ['S4.T8', 'Semi-supervised'], ['S4.T9', 'Unsupervised single object'], ['S4.T10', 'Unsupervised multiple objects'],
];
const names = ['J&F', 'Seen J', 'Seen F', 'Unseen J', 'Unseen F'];
const headers = [String.raw`\mathcal{J\&F}`, String.raw`\mathcal{J}_{s}`, String.raw`\mathcal{F}_{s}`,
  String.raw`\mathcal{J}_{u}`, String.raw`\mathcal{F}_{u}`];
function value(cell: string) {
  const match = cell.match(/^(\d+(?:\.\d+)?)(?:\s+\\(?:up|down)arrow_\{[+-]?[\d.]+\})?$/);
  if (!match) throw new Error('Invalid segmentation score: ' + cell);
  return Number(match[1]);
}
export default {
  benchmark: 'long-term-video-object-segmentation-v2', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2404.19326',
  parts: Object.fromEntries(['Test', 'Validation'].flatMap(split => names.map(metric => {
    const name = split + ': ' + metric;
    return [name, {name, unit: '%' as const}];
  }))),
  async fetch() {
    const html = await paperHtml(feed);
    return checked(tables.flatMap(([id, protocol], i) => {
      const figure = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      if (!figure) throw new Error('Missing LVOS results: ' + id);
      const [splits, columns, ...rows] = grid(paperTables(figure)[0]);
      const val = splits.indexOf('Validation'), test = splits.indexOf('Test');
      for (const index of [val, test]) {
        if (index < 0 || columns.slice(index, index + 5).join('|') !== headers.join('|')) throw new Error('Missing J&F columns');
      }
      return rows.map(cells => {
        const metrics: Record<string, number> = {fps: value(cells[1]), memoryGB: value(cells[2])};
        names.forEach((name, j) => {
          metrics['Validation: ' + name] = value(cells[val + j]);
          metrics['Test: ' + name] = value(cells[test + j]);
        });
        return {model: cells[0], setting: protocol + (i < 3 ? ', original weights' : ', LVOS training'),
          score: metrics['Test: J&F'], metrics};
      });
    }), 35);
  },
} satisfies Leaderboard;
