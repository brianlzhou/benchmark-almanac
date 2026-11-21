// Med-EASi tests controllable simplification of medical text. Table 4 reports SARI on the test set.
// The other columns measure individual edit operations, readability, and overlap with the reference.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2302.09155';
const board: Leaderboard = {
  benchmark: 'med-easi', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2302.09155.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === 'models|base|angle|SARI|ADD|DEL|KEEP|FKGL|ROUGE-l' && t === tables.at(-1));
    if (!table) throw new Error('Missing Med-EASi test results');
    const rows: LeaderboardRow[] = table.slice(1).map(([model, , angle, ...cells]) => {
      if (cells.length !== 6) throw new Error('Unexpected test result columns');
      const [score, add, del, keep, fkgl, rougeL] = cells.map(numberCell);
      return {model: model.replace('_{ip}', '_ip'), setting: angle.replace('_{ip}', '_ip'), score, metrics: {add, del, keep, fkgl, rougeL}};
    });
    return checked(rows, 2);
  },
};
export default board;
