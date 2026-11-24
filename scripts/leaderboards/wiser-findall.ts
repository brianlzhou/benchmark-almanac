// WISER-FindAll compares entity discovery systems on recall against a union ground-truth set.
// The headline score is Recall, reported as a percentage in Parallel's published comparison table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://parallel.ai/products/findall.md';
const rowRe = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*\|$/gm;

const board: Leaderboard = {
  benchmark: 'wiser-findall',
  url: 'https://parallel.ai/products/findall',
  feed: FEED,
  stats: { cpm: { name: 'Cost per thousand requests', unit: 'usd', better: 'lower' } },
  chart: {
    title: 'Recall vs cost',
    x: { key: 'cpm', label: 'Cost per 1,000 requests (CPM)', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Recall', unit: '%', better: 'higher' },
    note: 'Recall against cost per 1,000 requests on a log scale.',
  },
  terms: 'Parallel publishes this comparison and its WISER-FindAll methodology on the public product page. https://parallel.ai/products/findall',
  async fetch() {
    const text = await fetchText(FEED);
    const start = text.indexOf('| Series');
    if (start < 0) throw new Error('WISER-FindAll: comparison table missing');
    const table = text.slice(start);
    const rows: LeaderboardRow[] = [];
    for (const m of table.matchAll(rowRe)) {
      const [, series, model, cpm, recall] = m;
      const cpmNum = Number(cpm);
      rows.push({ model, harness: series, score: Number(recall), cost: cpmNum / 1000, metrics: { cpm: cpmNum } });
    }
    if (rows.length !== 6) throw new Error(`WISER-FindAll: expected 6 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
