// NewsQA tests whether a model can extract answers from CNN news articles.
// Table 5 in the published paper reports F1 and exact match on the development and test splits.
// The headline is NewsQA test F1, the first measure in the NewsQA test columns.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = 'https://aclanthology.org/W17-2623.pdf';
const board: Leaderboard = {
  benchmark: 'newsqa', url: 'https://aclanthology.org/W17-2623/', feed, static: 'paper',
  terms: 'ACL Anthology publishes the paper under the terms at https://aclanthology.org/info/copyright/.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 5: Neural model performance on SQuAD and NewsQA.')[1]?.split(/\n\s*\n/)[0];
    if (!table || !/NewsQA\s+Dev\s+Test/.test(table) || !/Model\s+F1\s+EM\s+F1\s+EM\s*\n/.test(table)) {
      throw new Error('NewsQA test columns missing');
    }
    const rows = [...table.matchAll(/^\s*([\w-]+)\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+\1\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)[ \t]*$/gm)]
      .map(([, model, devF1, devEM, testF1, testEM]) => ({
        model, score: Number(testF1), metrics: { exactMatch: Number(testEM), devF1: Number(devF1), devExactMatch: Number(devEM) },
      }));
    return checked(rows, 2);
  },
};
export default board;
