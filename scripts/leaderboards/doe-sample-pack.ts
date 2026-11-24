// Agents carry out five workplace assignments. The Harbor results table gives mean score over valid attempts.
// Each cell also lists strict passes and valid attempts. The final Frontier row pools several models.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://hub.harborframework.com/datasets/doe/sample-pack';
const parts = ['Consent sweep', 'Closing checklist', 'Covenant', 'Waterfall', 'Month-end close'];
const board: Leaderboard = {
  benchmark: 'doe-sample-pack', url, feed: url,
  terms: 'DOE publishes this results table on Harbor Hub. https://hub.harborframework.com/terms',
  parts: Object.fromEntries(parts.map(name => [name, name])),
  stats: { strictPasses: { name: 'Strict passes', unit: 'count' }, valid: { name: 'Valid attempts', unit: 'count' } },
  async fetch() {
    const header = ['Model', ...parts, 'All tasks'].join('|');
    const table = tables(await fetchText(url)).find(t => t[0].map(c => c.text).join('|') === header);
    if (!table) throw new Error('Missing DOE all-tasks table');
    const rows = table.slice(1).filter(r => !r[0].text.startsWith('Frontier (')).map(row => {
      const cells = row.slice(1).map(c => {
        const match = c.text.match(/^(0(?:\.\d+)?|1(?:\.0+)?) \((\d+)\/(\d+)\)$/);
        if (!match) throw new Error('Invalid DOE score or pass count: ' + c.text);
        return match.slice(1).map(Number);
      });
      if (cells.length !== parts.length + 1) throw new Error('Incomplete DOE row');
      const [score, strictPasses, valid] = cells[parts.length];
      return { model: row[0].text, score, metrics: { strictPasses, valid,
        ...Object.fromEntries(parts.map((name,i) => [name, cells[i][0]])) } };
    });
    return checked(rows, 7);
  },
};
export default board;
