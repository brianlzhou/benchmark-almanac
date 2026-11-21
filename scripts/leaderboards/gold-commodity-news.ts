// The source reports no overall score. The headline is the plain mean of the 7 parts, computed by this importer.
// Table 3 reports F1, precision and recall for seven binary classifications of gold-news headlines.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2009.04202';
const categories = ['Price or Not', 'Price Up', 'Price Constant', 'Price Down', 'Past Price News', 'Future Price News', 'Asset Comparison'];
const board: Leaderboard = {
  benchmark: 'gold-commodity-news', static: 'paper', url: feed, feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall score. The headline is the plain mean of F1 across the seven reported headline categories.',
  parts: Object.fromEntries(categories.map(name => [name,name])),
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid)
      .find(t => JSON.stringify(t[0]?.slice(3)) === JSON.stringify(categories));
    if (!table) throw Error('Missing gold-news category columns');
    const rows = table.filter(r => r[2] === 'F1-Score').map(r => {
      const model = r[1].replace(' (Baseline Model)','');
      const metrics: Record<string, number> = {};
      for (const measure of ['Precision','Recall','F1-Score']) {
        const cells = table.find(c => c[1] === r[1] && c[2] === measure);
        for (const [i,name] of categories.entries()) {
          const number = cells?.[i+3]?.match(/^(0(?:\.\d+)?|1(?:\.0+)?)(?:\s|$)/);
          if (!number) throw Error('Missing ' + name + ' ' + measure + ' for ' + model);
          metrics[measure === 'F1-Score' ? name : name+' '+measure] = Number(number[1]) * 100;
        }
      }
      return {model, score:categories.reduce((sum,name) => sum+metrics[name],0)/categories.length, metrics};
    });
    return checked(rows,8);
  },
};
export default board;
