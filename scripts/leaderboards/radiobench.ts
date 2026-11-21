// RadioBench tests language models on radio-frequency engineering tasks.
// Table II reports four model rows across QAA, CPR, HDR and SIR levels, with QAA Level 1 used as the headline.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2606.01862';
const board: Leaderboard = {
  benchmark: 'radiobench', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2606.01862',
  headline: 'The paper reports no overall score, so this is the QAA Level 1 accuracy column, the first task column.',
  parts: { qaa1: 'QAA Level 1', cpr2: 'CPR Level 2', cpr3: 'CPR Level 3', hdr2: 'HDR Level 2', hdr3: 'HDR Level 3', sir2: 'SIR Level 2', sir3: 'SIR Level 3' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Method|QAA|CPR|CPR|HDR|HDR|SIR|SIR');
    if (!table) throw new Error('RadioBench results table missing');
    const rows = table.slice(2).map(row => {
      if (row.length !== 7 && row.length !== 8) throw new Error('Invalid RadioBench row');
      const values = row.slice(1).map(Number); if (!values.every(Number.isFinite)) throw new Error('Invalid RadioBench score');
      const metrics = { qaa1: values[0] * 100, cpr2: values[1] * 100, cpr3: values[2] * 100, hdr2: values[3] * 100, hdr3: values[4] * 100, sir2: values[5] * 100, sir3: values[6] * 100 };
      return { model: row[0].replace(/ \[.*$/, ''), score: metrics.qaa1, metrics };
    });
    return checked(rows, 4);
  },
};
export default board;
