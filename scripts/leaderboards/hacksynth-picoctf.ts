// HackSynth PicoCTF measures the percentage of 120 challenges completed with each language model.
// Table I gives the overall result, six category percentages and elapsed time.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2412.01778';
const categories = ['General (34)', 'Forensics (21)', 'Crypto (23)', 'Web (21)', 'Rev (19)', 'Bin (2)'];
const board: Leaderboard = {
  benchmark: 'hacksynth-picoctf', static: 'paper', url: feed, feed, reference: ['HackSynth'],
  terms: 'The authors publish Table I under the paper terms at https://arxiv.org/abs/2412.01778.',
  parts: Object.fromEntries(categories.map(name => [name.split(' ')[0].toLowerCase(), name])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[1] === 'PicoCTF Benchmark');
    const header = ['All (120)', ...categories, 'Speed'];
    if (!table || table[1].slice(1, 9).join('|') !== header.join('|')) throw new Error('Missing PicoCTF results columns');
    return checked(table.slice(2).map(r => {
      const speed = r[8].match(/^(\d+)m$/);
      if (!speed) throw new Error('Missing PicoCTF elapsed time');
      const metrics = Object.fromEntries(Object.keys(board.parts!).map((key, i) => [key, numberCell(r[i + 2])]));
      return { model: r[0], harness: 'HackSynth', score: numberCell(r[1]), metrics: { ...metrics, minutes: Number(speed[1]) } };
    }), 8);
  },
};
export default board;
