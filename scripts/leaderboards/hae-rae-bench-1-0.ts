// HAE-RAE Bench tests Korean vocabulary, knowledge and reading comprehension.
// The authors' v1 README lists average accuracy and accuracy on all six tasks.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://github.com/HAE-RAE/HAE-RAE-BENCH';
const feed = 'https://raw.githubusercontent.com/HAE-RAE/HAE-RAE-BENCH/HEAD/README.md';
const parts = { LW: 'Loan Words', RW: 'Rare Words', SN: 'Standard Nomenclature', RC: 'Reading Comprehension', HI: 'History', GK: 'General Knowledge' };
const board: Leaderboard = {
  benchmark: 'hae-rae-bench-1-0', url, feed, parts,
  terms: 'The authors publish the results on GitHub under https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === ['Models', ...Object.keys(parts), 'Av.'].join('|'));
    if (!table) throw new Error('Missing HAE-RAE v1 results');
    return checked(table.slice(1).map(r => ({
      model: r[0], score: numberCell(r[7]),
      setting: ['Text-Davinci-003', 'HyperClova LK-D2'].includes(r[0]) ? '3-shot' : 'Log-likelihood',
      metrics: Object.fromEntries(Object.keys(parts).map((key, i) => [key, numberCell(r[i + 1])])),
    })), 10);
  },
};
export default board;
