// RVG-Bench tests localization of the video segment that answers a reasoning question.
// The project's Main Results table reports sample-weighted overall mean intersection over union as a percentage.
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard } from './types.ts';
const feed = 'https://fyrisk.github.io/RVG-Bench/';
const names = {Caus:'Causal', Seq:'Sequential', Ref:'Referential', Char:'Character-centric', Anom:'Contextual anomaly',
  Symb:'Symbolic', Comp:'Comparative', Ord:'Ordinal', single:'Single-step', multi:'Multi-step'};
const board: Leaderboard = {
  benchmark: 'rvg-bench', url: feed, feed,
  terms: 'The authors publish the results alongside the CC BY-NC-SA 4.0 annotations. https://huggingface.co/datasets/fyrisk159/RVG-Bench',
  headline: 'The score is overall mean intersection over union, expressed as a percentage.',
  parts: Object.fromEntries(Object.entries(names).map(([key,name]) => [key,{name,unit:'%'}])),
  stats: { recallAtIoU03: {name: 'Recall at IoU 0.3', unit: '%', better: 'higher'} },
  async fetch() {
    const table = tables(await fetchText(feed)).map(grid).find(t => t[0][12] === 'Overall' &&
      t[1]?.join('|') === 'Model|Input|Caus|Seq|Ref|Char|Anom|Symb|Comp|Ord|Overall|mIoU|mIoU|IoU@0.3');
    if (!table) throw new Error('Missing RVG-Bench overall mIoU and recall columns');
    return checked(table.slice(2).filter(r => new Set(r).size > 1 && r[0] !== 'Human baseline').map(([model, input, ...cells]) => {
      const values = cells.map(numberCell);
      if (values.length !== 12 || !['AV','V'].includes(input)) throw new Error('Invalid model row: ' + model);
      const metrics = {...Object.fromEntries(Object.keys(names).map((key,i) => [key, values[i]])), recallAtIoU03: values[11]};
      return {model, setting: 'Chain of thought, ' + (input === 'AV' ? 'audio-visual input' : 'visual input'), score: values[10], metrics};
    }), 22);
  },
};
export default board;
