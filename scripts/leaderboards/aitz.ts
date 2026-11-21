// AitZ measures exact next-action matches on Android screens. Tables 5 and 6 report the total match rate and action breakdown.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2403.02713';

const board: Leaderboard = {
  benchmark: 'aitz', static: 'paper',
  url: 'https://arxiv.org/abs/2403.02713',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const main = tables.find(t => t[0]?.[0] === 'Mode' && t[2]?.[10] === 'match');
    const ablation = tables.find(t => t[1]?.[1] === 'input' && t[2]?.[13] === 'match');
    if (!main || !ablation) throw new Error('Missing AitZ test comparisons');
    const parts = {scroll:'SCROLL', clickType:'CLICK type', clickMatch:'CLICK match', typeType:'TYPE type', typeMatch:'TYPE match', press:'PRESS', stop:'STOP', totalType:'Total type', gp:'GP'};
    board.parts = parts;
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string, values: string[]) {
      if (values.length !== 10 || values.some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid AitZ comparison');
      const numbers = values.map(Number);
      const [score] = numbers.splice(8, 1);
      rows.push({ model, setting, score, metrics: Object.fromEntries(Object.keys(parts).map((key, i) => [key, numbers[i]])) });
    }
    let model = '';
    for (const [mode, name, ...values] of main.slice(3)) {
      if (name !== '+CoAT') model = name;
      add(model, mode + (name === '+CoAT' ? ' +CoAT' : ''), values);
    }
    for (const cells of ablation.slice(3)) {
      const annotations = ablation[2].slice(1, 5).filter((_, i) => cells[i+1]);
      if (!annotations.length || annotations.join('/') === 'PAR/AT/AD') continue;
      add('AUTO-UI', 'FT ' + annotations.join('/'), cells.slice(5));
    }
    if (rows.length < 12) throw new Error('Incomplete AitZ test comparison');
    return rows;
  },
};
export default board;
