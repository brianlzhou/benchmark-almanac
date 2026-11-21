// ChestX-ray14 tests multi-label classification of chest radiographs. Code with Papers ranks
// archived model results by average AUC across all fourteen pathology labels, on a 0 to 100 scale.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = 'https://codewithpapers.app/sota/multi-label-classification-on-chestx-ray14';
export default {
  benchmark: 'chestx-ray14', url: feed, feed, host: 'Code with Papers',
  terms: 'Papers with Code archive, modified by Syntology, CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  parts: { macroF1: {name: 'Macro F1', unit: 'score', note: 'F1 on the published 0 to 1 scale.'} },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[2]?.text === 'Average AUC on 14 label');
    if (!table || table[0][1].text !== 'Model' || table[0][3].text !== 'Macro F1') throw new Error('Missing ChestX-ray14 columns');
    return checked(table.slice(1).map(c => {
      if (!/^\d+(?:\.\d+)?$/.test(c[2].text)) throw new Error('Missing average AUC');
      return {model: c[1].text, score: Number(c[2].text), metrics: c[3].text ? { macroF1: Number(c[3].text) } : undefined};
    }),4);
  },
} satisfies Leaderboard;
