// MarsRetrieval tests paired retrieval, landform retrieval and global localization.
// Tables 2, 3 and 5 use different metrics. The headline is text-to-image Recall@1 from Table 2.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.13961';
const board: Leaderboard = {
  benchmark: 'marsretrieval', static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the terms at https://arxiv.org/abs/2602.13961.',
  headline: 'The paper reports no overall score. The headline is text-to-image Recall@1 on the paired retrieval task.',
  async fetch() {
    const html = (await paperHtml(feed)).replaceAll("\u00a0", " ");
    const figures = [...html.matchAll(/<figure\b[^>]*class="ltx_table"[^>]*>([\s\S]*?)<\/figure>/g)].map(m => m[1]);
    function result(caption: string) {
      const figure = figures.find(s => s.includes(caption));
      if (!figure) throw new Error('Missing table: ' + caption);
      return grid(paperTables(figure)[0]);
    }
    const paired = result('Retrieval results of Task 1');
    const land = result('Retrieval results of Landform Retrieval');
    const geo = result('Retrieval results of Global Geo-Localization');
    if (paired[1].join('|') !== 'Size|Model|Backbone|R@1|R@10|MRR|MedR|R@1|R@10|MRR|MedR' ||
        land[0].join('|') !== 'Model|mAP|nDCG@10|Hits@10' || geo[1].join('|') !== 'Model|Text|Image|Text|Image|Text|Image|Text|Image|Text|Image') throw new Error('Missing MarsRetrieval measures');
    const pairKeys = ['t2iR1','t2iR10','t2iMRR','t2iMedR','i2tR1','i2tR10','i2tMRR','i2tMedR'];
    const parts: NonNullable<Leaderboard['parts']> = {};
    pairKeys.forEach((key, i) => {
      parts[key] = { name: (i < 4 ? 'Text to image ' : 'Image to text ') + paired[1][i+3],
        group: 'Paired retrieval', ...(key.endsWith('MedR') ? { better: 'lower' as const } : {}) };
    });
    const geoNames = geo[0].slice(1).map((name,i) => name + ' (' + geo[1][i+1] + ' AUPRC)');
    for (const name of land[0].slice(1)) parts[name] = { name, group: 'Landform retrieval' };
    geoNames.forEach((name,i) => parts['geo'+i] = { name, group: 'Global geo-localization' });
    board.parts = parts;
    return checked(paired.slice(2).filter(r => r[0] !== r[1]).map(row => {
      const model = row[1];
      const metrics = Object.fromEntries(pairKeys.map((k,i) => [k, numberCell(row[i+3])]));
      const landRow = land.find(r => r[0] === model);
      if (landRow) land[0].slice(1).forEach((key,i) => metrics[key] = numberCell(landRow[i+1]));
      const geoRow = geo.find(r => r[0] === model);
      if (geoRow) geoNames.forEach((_,i) => metrics['geo'+i] = numberCell(geoRow[i+1]));
      return { model, score: metrics.t2iR1, metrics };
    }), 19);
  },
};
export default board;
