// SPair-71k evaluates semantic correspondence between paired object images.
// SOTA2 ranks methods by PCK at a normalized correspondence threshold of 0.1.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/semantic-correspondence-on-spair-71k';
const board: Leaderboard = {
  benchmark: 'spair-71k', url: feed, feed, host: 'SOTA2',
  terms: 'SOTA2 publishes this leaderboard at ' + feed + '.',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Method|Links|PCK@0.1');
    if (!table) throw new Error('Missing SPair-71k correspondence leaderboard');
    return checked(table.slice(1).map(([method, links, score]) => {
      const model = text(method.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '').replace(/[†‡]$/, '');
      if (!model) throw new Error('Missing SPair model');
      const setting = text(method.html.match(/role="tooltip">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const dm = method.html.match(/<small>(\d{4})\.(\d{2})<\/small>/);
      const date = dm ? `${dm[1]}-${dm[2]}-01` : undefined;
      const paper = links.html.match(/href="(\/research\/paper\/[^"]+)"/i)?.[1];
      const link = links.html.match(/href="(https?:\/\/[^"]+)"/i)?.[1] ?? (paper ? `https://www.sota2.com${paper}` : undefined);
      return { model, setting: setting || undefined, score: numberCell(score.text), ...(date ? { date } : {}), ...(link ? { link } : {}) };
    }), 24);
  },
};
export default board;
