// DiagTrace tests how well a clinician agent reconstructs a case from requested evidence.
// The corrected Table 3 CSV reports Tversky alignment on 225 matched cases. Figure 2
// reports recall within each request category. The auxiliary quality ratings cover 100 cases.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const base = 'https://raw.githubusercontent.com/Fanncg1229/DiagTrace-code/HEAD/results/canonical_matched225/';
const feed = base + 'table3_recomputed_canonical225.csv';
const board: Leaderboard = {
  benchmark: 'diagtrace', url: 'https://github.com/Fanncg1229/DiagTrace-code', feed,
  terms: 'The code repository uses the MIT license. https://github.com/Fanncg1229/DiagTrace-code/blob/HEAD/LICENSE',
  headline: 'The first metric in the corrected Table 3 is Tversky alignment on 225 matched cases.',
  async fetch() {
    const table = parseCsv(await fetchText(feed));
    if (table[0]?.metric !== 'Tversky alignment' || table.length < 16) throw new Error('Missing corrected Table 3 metrics');
    const models = Object.keys(table[0]).filter(k => !['section','metric','source'].includes(k));
    const rows = models.map(model => {
      const metrics: Record<string, number> = {};
      for (const r of table.slice(1)) metrics[r.metric === 'Mean turns used' ? 'steps' : r.metric] = numberCell(r[model]);
      return {model, score: numberCell(table[0][model]), trials: 225, metrics};
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const categories = parseCsv(await fetchText(base + 'category_recall_corrected_canonical225.csv'));
    if (categories.length !== 9 * rows.length) throw new Error('Missing category recall rows');
    board.parts = {};
    for (const r of categories) {
      const row = rows.find(entry => entry.model === r.model);
      const key = r.category;
      if (!row || !key || key in row.metrics) throw new Error('Invalid category row');
      board.parts[key] = {name: key.replaceAll('_',' '), unit: 'score', note: 'Fraction of cases with a matching request among cases containing this category.'};
      row.metrics[key] = numberCell(r.category_recall);
    }
    return checked(rows, 4);
  },
};
export default board;
