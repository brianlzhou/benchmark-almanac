// CUAD tests whether models find clauses that require review in legal contracts. Table 2
// reports the area under the precision-recall curve and precision at two recall thresholds.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://datasets-benchmarks-proceedings.neurips.cc/paper/2021/file/6ea9ab1baa0efb9e19094440c317e21b-Paper-round1.pdf';
const board: Leaderboard = {
  stats: { precisionAt80Recall: { name: 'Precision at 80% recall', unit: '%', better: 'higher' }, precisionAt90Recall: { name: 'Precision at 90% recall', unit: '%', better: 'higher' } },
  benchmark: 'cuad', url: feed, feed, static: 'paper',
  terms: 'Table 2 is credited to Hendrycks and colleagues in the NeurIPS proceedings. https://datasets-benchmarks-proceedings.neurips.cc/paper/2021/hash/6ea9ab1baa0efb9e19094440c317e21b-Abstract-round1.html',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Model\s+AUPR\s+Precision@\s+Precision@\s+80% Recall\s+90% Recall\s+([\s\S]+?)Table 2: Results of NLP models on CUAD/);
    if (!table) throw new Error('Missing CUAD Table 2 or precision columns');
    const rows = table[1].trim().split(/\r?\n/).map(line => {
      const cells = line.trim().split(/\s{2,}/);
      if (cells.length !== 4) throw new Error('Missing CUAD result');
      const [model, setting] = cells[0].split(' + ');
      const [score, precisionAt80Recall, precisionAt90Recall] = cells.slice(1).map(Number);
      if (![score, precisionAt80Recall, precisionAt90Recall].every(Number.isFinite)) throw new Error('Invalid CUAD score');
      return {model, setting: setting || 'Fine-tuned on CUAD', score, metrics: {precisionAt80Recall, precisionAt90Recall}};
    });
    return checked(rows, 10);
  },
};
export default board;
