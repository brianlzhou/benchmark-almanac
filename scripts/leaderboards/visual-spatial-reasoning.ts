// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// VSR tests spatial relations in images. The authors' README gives accuracy on the random and zero-shot splits.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/cambridgeltl/visual-spatial-reasoning/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'visual-spatial-reasoning', url: 'https://github.com/cambridgeltl/visual-spatial-reasoning', feed,
  terms: 'The VSR repository uses Apache 2.0. https://github.com/cambridgeltl/visual-spatial-reasoning/blob/master/LICENSE',
  headline: 'The authors report separate accuracies for the random and zero-shot splits, so this is their plain mean.',
  parts: { random: 'Random split', zeroShot: 'Zero-shot' },
  async fetch() {
    const text = await fetchText(feed);
    const table = text.match(/^model\s*\|\s*random split\s*\|\s*zero-shot[^\n]*\n[^\n]+\n((?:[^\n]*\|[^\n]*\n)+)/im);
    if (!table) throw new Error('Missing VSR baseline table');
    const rows: LeaderboardRow[] = [];
    for (const line of table[1].trim().split('\n')) {
      const [name, first, second] = line.replaceAll('*', '').split('|').map(s => s.trim());
      if (name === 'human' || first === '-' || second === '-') continue;
      if (![first, second].every(s => /^\d+(?:\.\d+)?$/.test(s))) throw new Error('Unexpected VSR accuracy');
      const matches = /^(.*?) \((.*?)\)$/.exec(name);
      rows.push({ model: matches?.[1] ?? name, setting: matches?.[2], score: (Number(first) + Number(second)) / 2,
        metrics: { random: Number(first), zeroShot: Number(second) } });
    }
    return checked(rows, 4);
  },
};
export default board;
