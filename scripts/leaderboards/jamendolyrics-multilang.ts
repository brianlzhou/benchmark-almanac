// JamendoLyrics measures alignment between recorded singing and word onsets in lyrics.
// Table 3 gives average absolute error in seconds for all languages together and for each language.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2306.07744';
const languages = { EN: 'English', ES: 'Spanish', DE: 'German', FR: 'French' };
const board: Leaderboard = {
  benchmark: 'jamendolyrics-multilang', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 3 at https://arxiv.org/abs/2306.07744.',
  parts: Object.fromEntries(Object.entries(languages).map(([key, name]) =>
    [key, { name, unit: 'score', better: 'lower', note: 'Average absolute error in seconds.' }])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === '||All|All|EN|ES|DE|FR');
    if (!table || table[1].join('|') !== 'Model|Data|AAE|PCO|AAE|AAE|AAE|AAE') throw new Error('Missing multilingual results');
    return checked(table.slice(2).map(row => {
      if (row.length !== 8 || !['EN', 'All'].includes(row[1])) throw new Error('Unknown JamendoLyrics configuration');
      const metrics = Object.fromEntries(Object.keys(languages).map((key, i) => [key, numberCell(row[i + 4])]));
      metrics.pco = numberCell(row[3]);
      return { model: row[0], score: numberCell(row[2]), metrics, setting: row[1] === 'EN' ? 'English training' : 'Four-language training' };
    }), 5);
  },
};
export default board;
