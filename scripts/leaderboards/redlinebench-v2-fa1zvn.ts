// Models negotiate eight contract terms. The six-model table reports buyer reward relative to the best acceptable deal.
// The closes column gives the percentage of negotiations that ended in agreement.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/fa1zn/redline-v2/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'redlinebench-v2-fa1zvn', url: 'https://github.com/fa1zn/redline-v2', feed,
  terms: 'The author publishes the baseline on GitHub under its site terms. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  stats: { closes: { name: 'Deals closed', unit: '%', better: 'higher' } },
  async fetch() {
    const readme = await fetchText(feed);
    const trials = readme.match(/frontier models, n=(\d+) each/);
    const table = markdownTables(readme).find(t => t[0].join('|') === 'model|buyer reward|closes');
    if (!table || !trials) throw new Error('Missing Redline model table or trial count');
    const rows = table.slice(1).map(([model, reward, closes]) => {
      if (!/^\d+\.\d+$/.test(reward) || !/^\d+%$/.test(closes)) throw new Error('Invalid buyer result');
      return { model, score: Number(reward), trials: Number(trials[1]), metrics: { closes: parseFloat(closes) } };
    });
    return checked(rows, 6);
  },
};
export default board;
