// DSI-Bench measures dynamic spatial reasoning. Tables 1 and 3 report overall accuracy for each evaluation protocol.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2510.18873';

const board: Leaderboard = {
  benchmark: 'dsi-bench', static: 'paper',
  url: 'https://arxiv.org/abs/2510.18873',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Nova-Pro-V1": "amazon-nova-pro"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const comparisons = tables.filter(t => t[0]?.join('|') === 'Models|Object-Scene|Object-Scene|Observer-Scene|Observer-Scene|Observer-Object|Observer-Object|Overall');
    if (comparisons.length !== 2) throw new Error('Missing DSI-Bench results');
    const rows: LeaderboardRow[] = [];
    const keys = ['fixedObs','dynObs','staticSce','dynSce','distance','orientation'];
    board.parts = Object.fromEntries(keys.map((k, i) => [k, comparisons[0][1][i+1]]));
    for (const table of comparisons) {
      let protocol = '';
      for (const cells of table.slice(2)) {
        const model = cells[0];
        if (cells.every(v => v === model)) { protocol = model; continue; }
        if (model === 'Random' || cells[7] === '–') continue;
        function percent(i: number) {
          if (!/^\d+(?:\.\d+)?%$/.test(cells[i])) throw new Error('Invalid DSI-Bench accuracy');
          return Number.parseFloat(cells[i]);
        }
        const metrics = Object.fromEntries(keys.flatMap((k, i) => cells[i+1] === '–' ? [] : [[k, percent(i+1)]]));
        rows.push({ model, setting: (table === comparisons[0] ? 'RAWQA' : 'FFR') + ' / ' + protocol, score: percent(7), metrics });
      }
    }
    if (rows.length < 50) throw new Error('Incomplete DSI-Bench results');
    return rows;
  },
};
export default board;
