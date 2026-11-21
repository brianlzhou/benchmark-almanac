// ChainWorld measures whether a desktop agent completes every task in a chain.
// Table 1 reports chain completion, bootstrap 95% intervals and constituent task success for both protocols.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2606.21654';
const board: Leaderboard = {
  benchmark: 'chainworld', static: 'paper', feed, url: feed,
  aliases: { 'Kimi 2.5': 'kimi-k2-5' },
  terms: 'Scale AI publishes the paper under the terms at https://labs.scale.com/papers/chainworld.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join() === ',Chain completion,Chain completion,Task success,Task success');
    if (table?.[1].join() !== 'Model,Single,Multi,Single,Multi') throw new Error('Missing ChainWorld protocol columns');
    const rows = table.slice(2).flatMap(([model,...cells]) => ['Single turn','Multi-turn'].map((setting,i) => {
      const match = /^(\d+\.\d+)\s*\\pm\s*(\d+\.\d+)$/.exec(cells[i]);
      if (!match || !/^\d+\.\d+$/.test(cells[i+2])) throw new Error('Invalid result for ' + model);
      const score = Math.round(100 * Number(match[1])), interval = Math.round(100 * Number(match[2]));
      return {model, setting, score, low: score-interval, high: score+interval, metrics: {taskSuccess: 100 * Number(cells[i+2])}};
    }));
    return checked(rows, 8);
  },
};
export default board;
