// Live Gaming Benchmark tests commentary on gameplay. Table 1 measures caption win rate against Gemini 2.5 Pro.
// Tables 1 and 2 report text quality and response timing across three commentary scenarios.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2603.03447';
const scenarios = ['Solo Commentary', 'Co-Commentary', 'Guidance', 'Overall'];
const measures = [['CC', 'LiveU', 'FinalQ'], ['TimeDiff', 'PAUC', 'F1']];
const board: Leaderboard = {
  benchmark: 'live-gaming-benchmark', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The headline is the overall Closed Captions win rate against Gemini 2.5 Pro, in percent.',
  parts: Object.fromEntries(scenarios.slice(0, 3).map(s => [s + ' CC', { name: s, unit: '%' }])),
  stats: {
    'Overall CC': { name: 'Overall caption win rate', unit: '%', better: 'higher' },
    ...Object.fromEntries(scenarios.flatMap(s => [
      [s + ' LiveU', { name: s + ' LiveU score', unit: 'score', better: 'higher' }],
      [s + ' FinalQ', { name: s + ' final quality score', unit: 'score', better: 'higher' }],
      [s + ' TimeDiff', { name: s + ' response time difference', unit: 'seconds', better: 'lower' }],
      [s + ' PAUC', { name: s + ' partial area under the curve', unit: 'score', better: 'higher' }],
      [s + ' F1', { name: s + ' F1 score', unit: '%', better: 'higher' }],
    ])),
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const byModel = new Map<string, Record<string, number>>();
    for (const keys of measures) {
      const table = tables.find(t => scenarios.every((s, i) => keys.every((key, j) =>
        t[0]?.[1 + i * 3 + j] === s && t[1]?.[1 + i * 3 + j]?.split(' ')[0] === key)));
      if (!table) throw Error('Missing results for ' + keys.join(', '));
      for (const [model, ...cells] of table.slice(2)) {
        if (cells.every(cell => cell === model)) continue;
        const metrics = byModel.get(model) ?? {};
        for (const [i, cell] of cells.entries()) {
          if (cell === '-') continue;
          if (!/^\d+(\.\d+)?$/.test(cell)) throw Error('Invalid score for ' + model);
          metrics[scenarios[Math.floor(i / 3)] + ' ' + keys[i % 3]] = Number(cell);
        }
        byModel.set(model, metrics);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of byModel) {
      if (metrics['Overall CC'] === undefined && model === 'Gemini 2.5 Pro') continue;
      if (metrics['Overall F1'] === undefined) throw Error('Missing timing for ' + model);
      rows.push({ model, score: metrics['Overall CC'], metrics });
    }
    return checked(rows, 8);
  },
};
export default board;
