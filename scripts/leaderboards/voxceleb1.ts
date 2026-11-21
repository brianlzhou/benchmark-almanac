// VoxCeleb1 tests speaker identification from speech recorded in the wild. Table 7 reports
// top-1 and top-5 identification accuracy on 1,251 speakers. Top-1 accuracy is the headline.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.robots.ox.ac.uk/~vgg/publications/2017/Nagrani17/nagrani17.pdf';
const board: Leaderboard = {
  benchmark: 'voxceleb1', feed, url: feed, static: 'paper',
  terms: 'The authors publish their paper at Oxford. https://www.robots.ox.ac.uk/~vgg/data/voxceleb/vox1.html',
  async fetch() {
    const text = await pdfText(feed);
    const header = /Accuracy\s+Top-1 \(%\)\s+Top-5 \(%\)/;
    const table = text.split(header)[1]?.split('Table 7: Results for identification');
    if (table?.length !== 2) throw new Error('Missing speaker identification table');
    const rows = table[0].split('\n').flatMap(line => {
      const match = line.match(/ {3,}(\S.*?\S|\S)\s{2,}(\d+\.\d+)\s+(\d+\.\d+)\s*$/);
      if (!match) return [];
      return [{ model: match[1], score: Number(match[2]), metrics: { top5: Number(match[3]) } }];
    });
    return checked(rows, 5);
  },
};
export default board;
