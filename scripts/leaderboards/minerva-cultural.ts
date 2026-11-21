// MINERVA-Cultural evaluates reasoning about videos from 18 locales. Table 2 gives the authors' weighted aggregate accuracy.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2601.10649';
const locales = ['ar-EG', 'de-DE', 'en-GB', 'en-IN', 'es-MX', 'fr-FR', 'hi-IN', 'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pt-BR', 'ru-RU', 'ta-IN', 'te-IN', 'th-TH', 'zh-TW'];
const board: Leaderboard = {
  benchmark: 'minerva-cultural', url: feed, feed, static: 'paper',
  terms: 'The authors list the paper license at https://arxiv.org/abs/2601.10649.',
  parts: Object.fromEntries(locales.map(code => [code, code])),
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.[0] === 'Locale' && t[0].at(-1) === 'Human Performance' && t.at(-1)?.[0] === 'Aggregate');
    if (!table || table.slice(1, -1).map(r => r[0]).join('|') !== locales.join('|')) throw new Error('Missing locale accuracy table');
    const rows = table[0].slice(1, -1).map((model, i) => ({
      model, score: numberCell(table.at(-1)![i + 1]),
      metrics: Object.fromEntries(table.slice(1, -1).map(r => [r[0], numberCell(r[i + 1])])),
    }));
    return checked(rows, 7);
  },
};
export default board;
