// RSCC evaluates disaster change captions in three prompt settings.
// The authors compare models by ST5-SCS, their semantic similarity score, in the project results table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://bili-sakura.github.io/RSCC/";

const board: Leaderboard = {
  benchmark: "rscc-disaster-events",
  url: "https://bili-sakura.github.io/RSCC/",
  feed,
  terms: "The authors license the results page under CC BY-SA 4.0. The xBD images have separate research use terms. The host has no robots.txt.",
  stats: {
    rouge: { name: 'ROUGE', unit: '%', better: 'higher' },
    meteor: { name: 'METEOR score', unit: '%', better: 'higher' },
    bert: { name: 'BERT score', unit: '%', better: 'higher' },
    averageWords: { name: 'Average words', unit: 'count' },
  },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[1]?.[4]?.text === 'ST5-SCS(%)↑');
    if (!table || table.length < 32 || !['ROUGE(%)↑', 'METEOR(%)↑', 'BERT(%)↑'].every((h,i) => table[1][i+1].text === h)) throw new Error('Missing RSCC standings');
    let model = '';
    return table.slice(2).map(cells => {
      const label = cells[0].text;
      if (!label.startsWith('+')) model = label;
      const [rouge, meteor, bert, score, words] = cells.slice(1).map(c => num(c.text));
      if (!model || [rouge, meteor, bert, score, words].some(v => v === undefined)) throw new Error('Incomplete caption score');
      return { model, setting: label.startsWith('+') ? label.slice(1).trim() : 'Zero-shot', score: score!,
        metrics: { rouge: rouge!, meteor: meteor!, bert: bert!, averageWords: words! } };
    });
  },
};
export default board;
