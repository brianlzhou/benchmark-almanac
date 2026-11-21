// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// SVG-Bench evaluates image-to-SVG reconstruction. The authors' project page gives DinoScore for five datasets.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = 'https://starvector.github.io/starvector/';
const parts = ['SVG-Stack','SVG-Fonts','SVG-Icons','SVG-Emoji','SVG-Diagrams'];
const board: Leaderboard = {
  benchmark: 'svg-bench-starvector', url: feed, feed,
  terms: 'StarVector is released under Apache 2.0. https://github.com/joanrod/star-vector/blob/main/LICENSE',
  headline: 'The project page gives no overall image-to-SVG score, so this is the plain mean of the five dataset DinoScores.',
  parts: Object.fromEntries(parts.map(p => [p,p])),
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === ['Method',...parts].join('|'));
    if (!table) throw Error('Missing DinoScore table');
    const rows = table.slice(1).flatMap(([name,...cells]) => {
      const model = name.text.replace(/^💫\s*/, '');
      if (['AutoTrace','Potrace','VTracer','LIVE','DiffVG'].includes(model) || cells.some(c => c.text === '-')) return [];
      if (cells.length !== 5 || cells.some(c => !/^\d+\.\d+$/.test(c.text))) throw Error('Invalid DinoScores');
      const metrics = Object.fromEntries(parts.map((p,i) => [p,Number(cells[i].text)]));
      return [{ model, setting: 'Image-to-SVG', score: Object.values(metrics).reduce((a,b) => a+b,0)/5, metrics }];
    });
    return checked(rows, 2);
  },
};
export default board;
