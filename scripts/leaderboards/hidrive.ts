// HiDrive tests driving policies on 330 simulated routes.
// The README reports overall Drive Score and its route completion, legal and ethics measures.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://github.com/VDIGPKU/HiDrive';
const feed = 'https://raw.githubusercontent.com/VDIGPKU/HiDrive/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'hidrive', url, feed,
  terms: 'The authors permit academic research use and require authorization for commerce at https://github.com/VDIGPKU/HiDrive#license.',
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === 'Method|Overall DS|RC|LS|ES');
    if (!table) throw new Error('Missing HiDrive main findings');
    return checked(table.slice(1).map(row => {
      if (row.length !== 5) throw new Error('Missing HiDrive measure');
      const [score, routeCompletion, legalScore, ethicsScore] = row.slice(1).map(numberCell);
      return { model: row[0], score, metrics: { routeCompletion, legalScore, ethicsScore } };
    }), 4);
  },
};
export default board;
