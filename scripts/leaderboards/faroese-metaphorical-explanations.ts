// The Faroese metaphor task scores the percentage of correct dictionary explanations across 457 items.
// Table 6 of the paper gives model accuracy and confidence intervals.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.lrec-main.354.pdf";
const board: Leaderboard = {
  benchmark: "faroese-metaphorical-explanations", static: 'paper',
  url: "https://aclanthology.org/2026.lrec-main.354.pdf",
  feed,
  terms: "Table 6, accuracy across 457 items. Exclude the separate human sample. The university lists the paper under CC BY. The authors supply the datasets on request. ACL Anthology returned 404 for robots.txt.",
  async fetch() {
    const doc = await pdfText(feed);
    const end = doc.indexOf('Table 6: Model Performance on Metaphor');
    const start = doc.lastIndexOf('Accuracy (%)', end);
    if (start < 0 || end < 0) throw new Error('Missing metaphor accuracy table');
    const rows = [...doc.slice(start, end).matchAll(/ {2,}([\w.-]+) {2,}(\d+\.\d+) ±(\d+\.\d+)\s*$/gm)]
      .filter(m => m[1] !== 'Human').map(m => ({ model: m[1], score: +m[2], low: +m[2] - +m[3], high: +m[2] + +m[3] }));
    if (rows.length < 7) throw new Error('Incomplete metaphor accuracy table');
    return rows;
  },
};
export default board;
