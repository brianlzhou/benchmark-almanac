// Animal Kingdom tests recognition of 140 animal actions. The authors' action recognition table reports overall mAP
// and the same metric for head, middle and tail classes under four training losses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = 'https://sutdcv.github.io/Animal-Kingdom/';
const board: Leaderboard = {
  benchmark: 'animal-kingdom', feed, url: feed, terms: 'Published by SUTD Computer Vision, https://sutdcv.github.io/Animal-Kingdom/.',
  parts: { head: 'Head', middle: 'Middle', tail: 'Tail' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[1]?.text === 'mAP' &&
      t[1]?.map(c => c.text).join('|') === 'Method|overall|head|middle|tail');
    if (!table) throw new Error('Missing action recognition results');
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const cells of table.slice(2)) {
      if (cells.length === 1) { setting = cells[0].text; continue; }
      const [model, ...values] = cells.map(c => c.text);
      if (!setting || values.length !== 4 || !values.every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Incomplete mAP result');
      const [score, head, middle, tail] = values.map(Number);
      rows.push({ model, score, setting, metrics: { head, middle, tail } });
    }
    return checked(rows, 12);
  },
};
export default board;
