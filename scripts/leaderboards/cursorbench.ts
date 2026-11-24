// CursorBench 3.0 scores coding tasks drawn from Cursor sessions. The March Composer 2 announcement
// publishes exact percentages for three Composer models in its benchmark table.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://cursor.com/blog/composer-2";
const board: Leaderboard = {
  benchmark: 'cursorbench',
  url: "https://cursor.com/blog/composer-2",
  feed,
  static: 'paper',
  terms: "Cursor's robots.txt allows the blog. Cursor's terms restrict automated extraction. Results are credited to Cursor.",
  reference: ['Cursor'],
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.some(c => c.text === 'CursorBench'));
    if (!table || table.length < 4) throw new Error('Missing Composer comparison rows');
    const header = table[0].map(c => c.text);
    const name = header.indexOf('Model'), score = header.indexOf('CursorBench');
    if (name < 0 || score < 0) throw new Error('Missing CursorBench columns');
    return table.slice(1).map(cells => {
      const model = cells[name]?.text, value = cells[score]?.text;
      if (!model || !value || !Number.isFinite(Number(value))) throw new Error('Invalid CursorBench row');
      return { model, score: Number(value), harness: 'Cursor' };
    });
  },
};
export default board;
