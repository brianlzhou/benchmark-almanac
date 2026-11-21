// WildAWM validation evaluates agents on out-of-distribution tasks synthesized across computer interfaces.
// Table 4 reports mean validation score for the base model and ablations. The score is the reported four-benchmark mean.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.26828';
const board: Leaderboard = {
  benchmark: 'wildawm-validation', url: 'https://github.com/MSR-Orchard/WildAWM', feed, static: 'paper',
  terms: 'The authors publish the benchmark paper on arXiv. https://arxiv.org/licenses/',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0].join('|') === 'Model|O2W|QCB|OSV|Val.|Avg.');
    if (!table) throw Error('Missing WildAWM validation table');
    const rows = table.slice(1).map(([model, o2w, qcb, osv, validation, average]) => {
      const values = [o2w, qcb, osv, validation, average].map(Number);
      if (!model || values.some(v => !Number.isFinite(v))) throw Error('Invalid WildAWM row');
      return { model, score: values[4], metrics: { onlineMind2Web: values[0], qwenClawBench: values[1], openScienceVenture: values[2], validation: values[3] } };
    });
    return checked(rows, 7);
  },
};
export default board;
