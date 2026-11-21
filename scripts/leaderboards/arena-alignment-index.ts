// Arena measures how well agents follow user intent and report their work honestly.
// Village LLM Atlas republishes the overall Alignment Index in its ranking table.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://atlas.village.dev/benchmarks/arena-alignment-index?tab=scores';
const board: Leaderboard = {
  benchmark: 'arena-alignment-index',
  url: feed,
  feed,
  host: 'Village LLM Atlas',
  terms: 'Village LLM Atlas permits crawling at https://atlas.village.dev/robots.txt and credits Arena for these scores.',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === '#|Model|Setting|Score|Source');
    if (!table) throw new Error('Alignment Index ranking columns missing');
    const rows = table.slice(1).map(row => {
      const [, model, setting, score, source] = row.map(cell => cell.text);
      if (source !== 'Arena Alignment Index' || !/^\d+(?:\.\d+)?$/.test(score)) throw new Error('Unexpected Alignment Index row');
      return { model, score: Number(score), ...(['not reported', '—'].includes(setting) ? {} : { setting }) };
    });
    return checked(rows, 26);
  },
};
export default board;
