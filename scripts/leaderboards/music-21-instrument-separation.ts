// MUSIC-21 tests sound separation in videos of musical instruments.
// Tables 1 and 2 report signal-to-distortion ratio in decibels at each mixture size.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/1904.05979';
const board: Leaderboard = {
  benchmark: 'music-21-instrument-separation', static: 'paper', url: feed, feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: {
    SIR: { name: 'SIR', unit: 'score', note: 'Signal-to-interference ratio in decibels.' },
    SAR: { name: 'SAR', unit: 'score', note: 'Signal-to-artifacts ratio in decibels.' },
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const rows: LeaderboardRow[] = [];
    for (const header of ['Method|SDR|SIR|SAR', 'N|Method|SDR|SIR|SAR']) {
      const table = tables.find(t => t[0]?.join('|') === header);
      if (!table) throw Error('Missing MUSIC-21 sound separation table');
      for (const cells of table.slice(1)) {
        const [size, model, ...values] = header.startsWith('N|') ? cells : ['2', ...cells];
        if (model.startsWith('Ours,')) continue;
        if (values.length !== 3 || values.some(v => !/^-?\d+(?:\.\d+)?$/.test(v))) throw Error('Invalid separation metrics');
        const [score, SIR, SAR] = values.map(Number);
        rows.push({ model, score, setting: size + ' instruments', metrics: { SIR, SAR } });
      }
    }
    return checked(rows, 8);
  },
};
export default board;
