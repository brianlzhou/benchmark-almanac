// SciQ tests multiple-choice science question answering. Table 2 reports test accuracy on the multiple-choice benchmark.
// The authors compare two reading-comprehension models with the Aristo system and its retrieval and reasoning components.
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import type { Leaderboard } from './types.ts';
const feed = 'https://aclanthology.org/W17-4413.pdf';
const board: Leaderboard = {
  benchmark: 'sciq', url: feed, feed, static: 'paper',
  terms: 'ACL Anthology publishes the paper under the terms linked at https://aclanthology.org/W17-4413/.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 2: Test set accuracy of existing models')[0].split(/Model\s+Accuracy/).at(-1);
    if (!table?.includes('Humans') || !table.includes('TableILP')) throw new Error('Missing SciQ test accuracy table');
    // Lucene is the standalone keyword-search baseline. The table also includes a human reference.
    const rows = [...table.matchAll(/^\s*(Aristo|TableILP|AS Reader|GA Reader)\s+(\d+\.\d+)/gm)]
      .map(([,model,value]) => ({model, score: Number(value)}));
    return checked(rows, 4);
  },
};
export default board;
