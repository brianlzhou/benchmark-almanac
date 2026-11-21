// mFollowIR tests whether retrieval models follow changed instructions in Persian, Chinese, and Russian.
// Tables 3 and 4 report average pairwise mean reciprocal rank (p-MRR) for cross-lingual and multilingual retrieval.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2501.19264';
const board: Leaderboard = {
  benchmark: 'mfollowir', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2501.19264.',
  parts: {persian: 'Persian', chinese: 'Chinese', russian: 'Russian'},
  stats: { ndcg20: {name:'Average nDCG@20',unit:'score',better:'higher'}, persianNdcg20: {name:'Persian nDCG@20',unit:'score',better:'higher'}, chineseNdcg20: {name:'Chinese nDCG@20',unit:'score',better:'higher'}, russianNdcg20: {name:'Russian nDCG@20',unit:'score',better:'higher'} },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = tables.filter(t => t[1]?.join('|') === '|Model|nDCG@20||p-MRR|nDCG@20||p-MRR|nDCG@20||p-MRR|nDCG@20|p-MRR');
    if (results.length !== 2) throw new Error('Missing mFollowIR result tables');
    const rows: LeaderboardRow[] = [];
    for (const [i, table] of results.entries()) {
      if (table[0].filter((v, j) => [2,5,8,11].includes(j)).join('|') !== 'Persian|Chinese|Russian|Average') throw new Error('Language columns changed');
      for (const r of table.slice(2)) {
        rows.push({model: r[1], setting: i === 0 ? 'Cross-lingual' : 'Multilingual', score: numberCell(r[12]), metrics: {
          persian: numberCell(r[4]), chinese: numberCell(r[7]), russian: numberCell(r[10]), ndcg20: numberCell(r[11]),
          persianNdcg20: numberCell(r[2]), chineseNdcg20: numberCell(r[5]), russianNdcg20: numberCell(r[8]),
        }});
      }
    }
    return checked(rows, 36);
  },
};
export default board;
