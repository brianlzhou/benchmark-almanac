// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// AudioMNIST tests classification of spoken digits and speaker sex. Table 1 gives
// mean accuracy and standard deviation over the data splits for each task.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/1807.03418';
function task(cell: string) {
  const match = cell.match(/^(\d+\.\d+)\\%\\pm\s*(\d+\.\d+)\\%$/);
  if (!match) throw new Error('Missing AudioMNIST accuracy or standard deviation');
  return [Number(match[1]), Number(match[2])];
}
const board: Leaderboard = {
  benchmark:'audiomnist', static:'paper', url:feed, feed,
  terms:'The authors publish their accuracy table on arXiv. https://arxiv.org/abs/1807.03418',
  headline:'The paper reports no overall score, so this is the plain mean of digit and speaker sex classification accuracy.',
  parts:{digit:'Digit',sex:'Sex'},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') === '||Digit|Sex');
    if (!table || table[0][0] !== 'Model') throw new Error('Missing AudioMNIST task table');
    return checked(table.slice(2).map(([model,setting,d,s]) => {
      const [digit,digitStd] = task(d);
      const [sex,sexStd] = task(s);
      return {model,setting,score:(digit+sex)/2,metrics:{digit,digitStd,sex,sexStd}};
    }),2);
  },
};
export default board;
