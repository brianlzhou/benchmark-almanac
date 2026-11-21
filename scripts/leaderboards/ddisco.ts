// DDisCo tests discourse coherence in Danish text. Table 3 reports accuracy, precision, recall and weighted F1.
// The headline is weighted F1, the primary measure shown for each named model.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2022.lrec-1.260.pdf';
const board: Leaderboard = {
  benchmark: 'ddisco', static: 'paper', url: 'https://aclanthology.org/2022.lrec-1.260/', feed,
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const text = await pdfText(feed);
    if (!/Text\s+daBERT\s+0\.65\s+0\.61\s+0\.65\s+0\.62/.test(text) || !/Text\s+XLM-R\s+0\.66\s+0\.63\s+0\.66\s+0\.63/.test(text)) throw new Error('Missing DDisCo Table 3');
    return checked([
      { model: 'daBERT', setting: 'Text', score: 62, metrics: { accuracy: 65, precision: 61, recall: 65 } },
      { model: 'mBERT', setting: 'Text', score: 63, metrics: { accuracy: 67, precision: 64, recall: 67 } },
      { model: 'XLM-R', setting: 'Text', score: 63, metrics: { accuracy: 66, precision: 63, recall: 66 } },
    ], 3);
  },
};
export default board;
