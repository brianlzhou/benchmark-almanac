// Cat-Goric measures whether a language model can finish a 14-level game.
// The repository README publishes pass@1, pass@5, levels cleared and deaths for each model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/felladrin/cat-goric-game-benchmark/main/readme.md';

const board: Leaderboard = {
  benchmark: 'cat-goric-game-benchmark',
  url: 'https://github.com/felladrin/cat-goric-game-benchmark',
  feed,
  terms: 'The repository is licensed under MIT. https://github.com/felladrin/cat-goric-game-benchmark/blob/main/license.txt',
  stats: { levelsCleared: { name: 'Levels cleared', unit: 'count', better: 'higher' }, deaths: { name: 'Deaths', unit: 'count', better: 'lower' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(feed);
    const start = text.indexOf('| Rank | Model | Params | pass@1 | pass@5 | Levels cleared | Deaths |');
    if (start < 0) throw new Error('Cat-Goric leaderboard table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of text.slice(start).split('\n').slice(2)) {
      const cells = line.split('|').map(cell => cell.trim());
      if (cells.length < 8 || !/^\d+$/.test(cells[1])) break;
      const passAt1 = Number.parseFloat(cells[4].replace('%', ''));
      const levels = Number.parseFloat(cells[6].split('/')[0]);
      const deaths = cells[7].toLowerCase() === 'n/a' ? undefined : Number.parseFloat(cells[7]);
      const size = cells[3].match(/^(\d+(?:\.\d+)?)([BM])$/i);
      if (![passAt1, levels].every(Number.isFinite)) throw new Error('Invalid Cat-Goric row');
      rows.push({ model: cells[2], score: passAt1, params: size ? Number(size[1]) / (size[2].toUpperCase() === 'M' ? 1000 : 1) : undefined,
        metrics: { levelsCleared: levels, ...(deaths === undefined ? {} : { deaths }) } });
    }
    if (rows.length < 2) throw new Error('Cat-Goric leaderboard has too few rows');
    return rows;
  },
};

export default board;
