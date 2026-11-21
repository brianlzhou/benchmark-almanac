// OASIS tests when agents refuse harmful tasks and when they also refuse benign tasks.
// Table 2 reports both rates for four scenario and decoding settings. The headline is harmful-task refusal.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2511.08487';
const board: Leaderboard = {
  benchmark: 'oasis-agent-safety', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The headline is the refusal rate on harmful tasks. The false positive rate measures refusals on benign tasks.',
  aliases: { 'Qwen3-235B-Thinking': 'qwen3-235b-a22b-thinking-jul-2025', 'Qwen3-235B-Instruct': 'qwen3-235b-a22b-instruct-jul-2025' },
  parts: { falsePositiveRate: { name: 'False positive rate', unit: '%', better: 'lower' } },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|Realistic Scenario|Realistic Scenario|Idealized Scenario|Idealized Scenario' &&
      t[1]?.join('|') === 'Model|Greedy|Stochastic|Greedy|Stochastic');
    if (!table) throw Error('Missing Table 2 safety baselines');
    const rows: LeaderboardRow[] = [];
    for (const [model, ...cells] of table.slice(2)) {
      if (cells.every(c => c === model)) continue;
      if (cells.length !== 4) throw Error('Missing model setting');
      for (const [i, cell] of cells.entries()) {
        const rates = cell.match(/^(\d+\.\d+) \/ (\d+\.\d+)$/);
        if (!rates) throw Error('Missing refusal or false positive rate');
        const setting = table[0][i+1] + ', ' + table[1][i+1];
        rows.push({ model, setting, score: Number(rates[1]), metrics: { falsePositiveRate: Number(rates[2]) } });
      }
    }
    return checked(rows, 32);
  },
};
export default board;
