// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// CURE tests clinical passage retrieval. Tables 7 and 8 report NDCG@10 and Recall@100 for three query languages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2412.06954';
const langs = ['en', 'fr', 'es'];
const board: Leaderboard = {
  benchmark: 'cure', feed, url: feed, static: 'paper',
  terms: 'The authors publish the tables under the terms linked at https://arxiv.org/abs/2412.06954.',
  headline: 'The headline averages NDCG@10 across English, French and Spanish queries retrieving English passages.',
  parts: { en: 'English to English', fr: 'French to English', es: 'Spanish to English' },
  stats: { enRecallAt100: { name: 'English recall at 100', unit: 'score', better: 'higher' }, frRecallAt100: { name: 'French recall at 100', unit: 'score', better: 'higher' }, esRecallAt100: { name: 'Spanish recall at 100', unit: 'score', better: 'higher' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid).filter(t =>
      t[0]?.slice(1).join('|') === 'NDCG@10|NDCG@10|NDCG@10|Recall@100|Recall@100|Recall@100' &&
      t[1]?.slice(1).join('|') === [...langs, ...langs].map(l => l + ' - en').join('|'));
    if (tables.length !== 2) throw new Error('Missing CURE retrieval tables');
    const rows: LeaderboardRow[] = [];
    for (const table of tables) {
      for (const [label, ...cells] of table.slice(2)) {
        if (cells.length !== 6) throw new Error('Unexpected retrieval columns');
        if (cells.includes('-')) continue;
        const values = cells.map(numberCell);
        const model = label.replace(/ \( [^()]+ \)$/, '');
        const metrics = Object.fromEntries([...langs, ...langs.map(l => l + 'RecallAt100')].map((k, i) => [k, values[i]]));
        rows.push({ model, score: (metrics.en + metrics.fr + metrics.es) / 3, metrics });
      }
    }
    return checked(rows, 13);
  },
};
export default board;
