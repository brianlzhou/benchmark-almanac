// OmniVBench evaluates video generators on seven reference-following task families.
// The makers' model comparison table ranks generators by Overall and reports a score for each family.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://wxliii.github.io/OmniVBench/benchmark.html';
const families = ['Content', 'Motion', 'Style', 'Structure', 'Narrative', 'Multi-content', 'Cross-aspect'];
const header = ['Model', 'Group', ...families, 'Overall'];
const board: Leaderboard = {
  benchmark: 'omnivbench', url: feed, feed,
  terms: 'The authors publish their comparison at https://wxliii.github.io/OmniVBench/benchmark.html.',
  parts: Object.fromEntries(families.map(name => [name, name])),
  aliases: { 'Seedance 2.5': 'dreamina-seedance-2-5', 'Seedance 2.0': 'dreamina-seedance-2-0' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === header.join('|'));
    if (!table) throw new Error('Missing OmniVBench model comparison');
    const rows = table.slice(1).map(row => {
      if (row.length !== header.length || !['Open', 'Closed'].includes(row[1].text)) throw new Error('Unexpected OmniVBench row');
      const metrics = Object.fromEntries(families.map((key, i) => [key, numberCell(row[i + 2].text)]));
      return { model: row[0].text, open: row[1].text === 'Open', score: numberCell(row[9].text), metrics };
    });
    return checked(rows, 11);
  },
};
export default board;
