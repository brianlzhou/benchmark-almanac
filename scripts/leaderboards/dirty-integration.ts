// Dirty Integration tests agents against an API with cursor, type and quota faults.
// The repository README publishes measured model rewards for clean, realistic and hostile profiles.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/buildok/dirty-integration/main/README.md';

const board: Leaderboard = {
  benchmark: 'dirty-integration',
  url: 'https://github.com/buildok/dirty-integration',
  feed,
  terms: 'The repository is licensed under MIT. https://github.com/buildok/dirty-integration/blob/main/LICENSE',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(feed);
    const start = text.indexOf('| Model | `clean` | `realistic` | `hostile` |');
    if (start < 0) throw new Error('Dirty Integration measured-model table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of text.slice(start).split('\n').slice(2)) {
      const cells = line.split('|').map(cell => cell.trim());
      if (cells.length < 5 || !cells[1]) break;
      const clean = Number.parseFloat(cells[2]);
      const realistic = Number.parseFloat(cells[3]);
      const hostile = Number.parseFloat(cells[4]);
      if (!Number.isFinite(hostile)) continue;
      if (![clean, realistic].every(Number.isFinite)) throw new Error('Invalid Dirty Integration row');
      rows.push({ model: cells[1].replace(/`/g, ''), score: hostile, setting: 'hostile' });
    }
    if (rows.length < 2) throw new Error('Dirty Integration table has too few model rows');
    return rows;
  },
};

export default board;
