// The source reports no overall score. The headline is the plain mean of the 22 parts, computed by this importer.
// Pixel2Perspective tests open-vocabulary segmentation. Its project tables give mIoU on 13 RGB and 9 infrared datasets.
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const feed = 'https://aniruddhsikdar1.github.io/publications/pixel2perspective/';
const datasets = {
  RGB: ['MSRS','MVSeg','SemanticRT','ACDC','MFNet','Infraparis','CART','UAVid','Indraeye','ISPRS','Worldfloods','LoveDA','OpenEarthMap'],
  IR: ['MSRS','MVSeg','SemanticRT','MFNet','Infraparis','CART','Indraeye','ISPRS','Worldfloods'],
};
const board: Leaderboard = {
  benchmark: 'pixel2perspective', url: feed, feed,
  terms: 'The authors publish project tables with their MIT-licensed toolkit. https://github.com/adityagandhamal/Pixel2Perspective/blob/HEAD/LICENSE',
  headline: 'The project reports no overall score, so this is the plain mean of its 22 dataset and sensor mIoU scores.',
  parts: Object.fromEntries(Object.entries(datasets).flatMap(([sensor, names]) => names.map(name => [sensor + ' ' + name, {name, group: sensor}]))),
  async fetch() {
    const html = await fetchText(feed);
    const runs = new Map<string, LeaderboardRow>();
    for (const section of html.split(/(?=<h[34]\b)/i)) {
      const heading = text(section.split(/<\/h[34]>/i)[0]);
      const m = heading.match(/^Trained on (COCO-Stuff|MSRS|ACDC|IndraEye|OpenEarthMap).*?evaluated on (RGB|IR)(?: \(mIoU\))?$/);
      if (!m) continue;
      const sensor = m[2] as keyof typeof datasets;
      const table = tables(section).map(grid)[0];
      const columns = table?.[1]?.slice(1).map(name => name.replace(' (irrg)', ''));
      if (!columns || columns.join('|') !== datasets[sensor].join('|')) throw new Error('Missing columns for ' + heading);
      for (const [model, ...cells] of table.slice(2)) {
        const key = m[1] + '/' + model;
        const row = runs.get(key) ?? {model, setting: 'Trained on ' + m[1], score: 0, metrics: {}};
        if (cells.length !== columns.length) throw new Error('Incomplete row for ' + key);
        cells.forEach((value, i) => { row.metrics![sensor + ' ' + columns[i]] = numberCell(value); });
        runs.set(key, row);
      }
    }
    const rows = [...runs.values()].filter(r => Object.keys(r.metrics!).length === 22);
    for (const row of rows) row.score = Object.values(row.metrics!).reduce((sum, value) => sum + value, 0) / 22;
    return checked(rows, 23);
  },
};
export default board;
