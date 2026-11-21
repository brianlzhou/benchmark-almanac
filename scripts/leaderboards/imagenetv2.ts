// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// ImageNetV2 tests classification on newly collected images. Tables 14 to 19
// report top-1 and top-5 accuracy and confidence intervals for three sampling strategies.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/1902.10811';
const splits = ['MatchedFrequency', 'Threshold0.7', 'TopImages'];
const names = ['Top-1', 'Top-5'].flatMap(metric => splits.map(split => metric + ' ' + split));
export default {
  benchmark: 'imagenetv2', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/1902.10811',
  headline: 'The paper reports no overall accuracy, so the headline is the plain mean of top-1 accuracy on its three test sets.',
  parts: Object.fromEntries(names.map(name => [name, {name, unit: '%' as const}])),
  stats: Object.fromEntries(names.flatMap(name => [name + ' low', name + ' high'].map(key => [key, { name: key.includes(' low') ? name + ' lower confidence bound' : name + ' upper confidence bound', unit: '%', note: '95% confidence interval bound for the reported accuracy.' }]))),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const models = new Map<string, Record<string, number>>();
    for (const name of names) {
      const pages = tables.filter(t => t[0]?.[0] === 'ImageNet ' + name);
      if (!pages.length) throw new Error('Missing ' + name);
      for (const page of pages) {
        if (page[2]?.[1] !== 'Model' || page[2]?.[3] !== 'New Accuracy') throw new Error('Missing accuracy column');
        for (const [, model, , cell] of page.slice(3)) {
          const values = cell.match(/^([\d.]+) \[([\d.]+), ([\d.]+)\]$/);
          if (!values) throw new Error('Invalid interval: ' + cell);
          const metrics = models.get(model) ?? {};
          if (name in metrics) throw new Error('Duplicate result for ' + model);
          metrics[name] = Number(values[1]);
          metrics[name + ' low'] = Number(values[2]);
          metrics[name + ' high'] = Number(values[3]);
          models.set(model, metrics);
        }
      }
    }
    return checked([...models].map(([model, metrics]) => {
      if (!names.every(name => name in metrics)) throw new Error('Incomplete model: ' + model);
      const score = splits.reduce((sum, split) => sum + metrics['Top-1 ' + split], 0) / splits.length;
      return {model, score, metrics};
    }), 67);
  },
} satisfies Leaderboard;
