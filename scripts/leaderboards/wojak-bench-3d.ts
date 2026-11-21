// Wojak-Bench 3D asks voters to compare two models' figures against the same drawing.
// The public table reports Bradley-Terry ratings with ties worth half a win.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const page = 'https://wojak-bench.dev.pion.dev/';
const board: Leaderboard = {
  benchmark: 'wojak-bench-3d', url: page + '#leaderboard', feed: page,
  terms: 'The voting page gives no score reuse license. Its robots.txt explains content signals and lists no disallowed paths.',
  async fetch() {
    const table = tables(await fetchText(page)).find(t => t[0].map(c => c.text).join('|') === '#|model|rating|win share|w/t/l|votes');
    if (!table || table.length < 11) throw new Error('Wojak-Bench 3D: incomplete rating table');
    return table.slice(1).map(row => {
      const [, model, rating, share, record, votes] = row.map(c => c.text);
      if (!model || !/^\d+$/.test(rating) || !/^\d+%$/.test(share) || !/^\d+\/\d+\/\d+$/.test(record) || !/^\d+$/.test(votes))
        throw new Error('Wojak-Bench 3D: invalid row for ' + model);
      const [wins, ties, losses] = record.split('/').map(Number);
      if (wins + ties + losses !== Number(votes)) throw new Error('Inconsistent vote count for ' + model);
      return { model, score: Number(rating), metrics: { winShare: parseInt(share, 10), votes: Number(votes), wins, ties, losses } };
    });
  },
};
export default board;
