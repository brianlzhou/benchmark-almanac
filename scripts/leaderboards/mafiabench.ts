// MafiaBench pits models against one another in a social deduction game. The tournament ranks them by Elo.
// The leaderboard also gives win rates for the mafia and town roles.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.mafiabench.org/';
const board: Leaderboard = {
  benchmark: 'mafiabench', url: feed, feed,
  aliases: { 'google/gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025' },
  terms: 'MafiaBench reserves all rights. https://www.mafiabench.org/',
  parts: { mafia: { name: 'Win Rate As Mafia', unit: '%' }, town: { name: 'Win Rate As Town', unit: '%' } },
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Rank|Model|ELO|Win Rate As Mafia|Win Rate As Town');
    if (!t) throw new Error('Missing MafiaBench leaderboard');
    return checked(t.slice(1).map(r => {
      const [, model, elo, mafia, town] = r.map(c => c.text);
      if (!/^\d+$/.test(elo) || ![mafia, town].every(v => /^\d+(\.\d+)?%$/.test(v))) throw new Error('Invalid MafiaBench row');
      return { model, score: Number(elo), metrics: { mafia: parseFloat(mafia), town: parseFloat(town) } };
    }), 6);
  },
};
export default board;
