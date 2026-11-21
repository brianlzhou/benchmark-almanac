// Roboflow 100-VL evaluates object detection across 100 datasets. The headline is the All column of mean average precision.
// Tables 2 and 7 cover four training settings. Table 8 reports the ten-run average and standard deviation.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.20612';
const board: Leaderboard = {
  benchmark: 'roboflow-100-vl',
  static: 'paper',
  url: feed,
  feed,
  terms: PAPER_TERMS + ' https://info.arxiv.org/help/license/index.html',
  parts: {"aerial":"Aerial","document":"Document","floraFauna":"Flora & Fauna","industrial":"Industrial","medical":"Medical","sports":"Sports","other":"Other"},
  aliases: {"Qwen 2.5 VL (72B)":"qwen2-5-vl-72b"},
  async fetch() {
    const html = await paperHtml(feed);
    const keys = ['aerial', 'document', 'floraFauna', 'industrial', 'medical', 'sports', 'other'];
    const rows = [];
    for (const id of ['S4.T2', 'A6.T7', 'A9.T8']) {
      const figure = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      const table = figure && paperTables(figure).map(grid).find(t =>
        t[0]?.join('|') === 'Method|Aerial|Document|Flora & Fauna|Industrial|Medical|Sports|Other|All');
      if (!table) throw new Error('Missing full RF100-VL results: ' + id);
      let group = id === 'A9.T8' ? '10-shot with federated loss, 10-run mean' : '';
      for (const [name, ...cells] of table.slice(1)) {
        if (cells.every(value => value === name)) {
          group = name;
          continue;
        }
        const label = name.replace(/\s*\[\s*\d+\s*\]/g, '');
        const match = label.match(/^(.+?)(?: \(((?:Class[- ]Names|Images|Instructions).*)\)| w\/ (.+))?$/);
        if (!match || !group || cells.length !== 8) throw new Error('Invalid RF100-VL model row');
        const settings = [group, match[2] ?? match[3]].filter(Boolean).join(', ');
        const metrics: Record<string, number> = {};
        const values = cells.map((cell, i) => {
          const fields = cell.split(/\s*\\pm\s*/);
          if (!fields.every(v => /^(?:\d+|\d*\.\d+)$/.test(v)) || fields.length !== (id === 'A9.T8' ? 2 : 1)) {
            throw new Error('Invalid RF100-VL mAP');
          }
          if (fields[1]) metrics[i === 7 ? 'std' : keys[i] + 'Std'] = Number(fields[1]);
          return Number(fields[0]);
        });
        keys.forEach((key, i) => { metrics[key] = values[i]; });
        rows.push({ model: match[1], setting: settings, score: values[7], metrics, trials: id === 'A9.T8' ? 10 : undefined });
      }
    }
    return checked(rows, 37);
  },
};
export default board;
