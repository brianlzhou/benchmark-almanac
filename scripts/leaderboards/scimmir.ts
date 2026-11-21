// SciMMIR tests scientific image and caption retrieval in both directions.
// Table 4 reports fine-tuned model results on the full benchmark.
// The headline is text-to-image MRR, with the inverse direction and Hits@10 as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2401.13478';
const board: Leaderboard = {
  benchmark: 'scimmir', static: 'paper', url: 'https://arxiv.org/abs/2401.13478', feed,
  headline: 'Table 4 lists text-to-image MRR first, so this is the full-benchmark text-to-image MRR.',
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2401.13478',
  parts: { txtToImg: 'Text to image MRR', imgToTxt: 'Image to text MRR' },
  stats: {
    'Alltxt→imgMRR': { name: 'All text to image MRR', unit: '%', better: 'higher' }, 'Alltxt→imgHits@10': { name: 'All text to image Hits@10', unit: '%', better: 'higher' }, 'Allimg→txtMRR': { name: 'All image to text MRR', unit: '%', better: 'higher' }, 'Allimg→txtHits@10': { name: 'All image to text Hits@10', unit: '%', better: 'higher' },
    'Figuretxt→imgMRR': { name: 'Figure text to image MRR', unit: '%', better: 'higher' }, 'Figuretxt→imgHits@10': { name: 'Figure text to image Hits@10', unit: '%', better: 'higher' }, 'Figureimg→txtMRR': { name: 'Figure image to text MRR', unit: '%', better: 'higher' }, 'Figureimg→txtHits@10': { name: 'Figure image to text Hits@10', unit: '%', better: 'higher' },
    'Tabletxt→imgMRR': { name: 'Table text to image MRR', unit: '%', better: 'higher' }, 'Tabletxt→imgHits@10': { name: 'Table text to image Hits@10', unit: '%', better: 'higher' }, 'Tableimg→txtMRR': { name: 'Table image to text MRR', unit: '%', better: 'higher' }, 'Tableimg→txtHits@10': { name: 'Table image to text Hits@10', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 4: The main results of SciMMIR benchmark')) throw new Error('SciMMIR Table 4 missing');
    const values: Array<[string, string, number, number, number, number]> = [
      ['CLIP-base', 'fine-tuned', 8.13, 13.48, 7.94, 13.34],
      ['CLIP-base+BERT', 'fine-tuned', 2.47, 5.01, 3.11, 5.85],
      ['BLIP-base', 'fine-tuned', 6.14, 11.30, 6.18, 11.71],
      ['BLIP-base+BERT', 'fine-tuned', 11.51, 20.09, 12.69, 21.77],
      ['BLIP2-FLAN-T5-XL', 'fine-tuned', 4.44, 7.74, 2.27, 4.48],
      ['CLIP-base+OCR', 'fine-tuned', 20.23, 29.60, 20.70, 30.19],
    ];
    const rows = values.map(([model, setting, txtToImg, txtToImgHits10, imgToTxt, imgToTxtHits10]) => ({ model, setting, score: txtToImg, metrics: { txtToImg, txtToImgHits10, imgToTxt, imgToTxtHits10 } }));
    return checked(rows, 6);
  },
};
export default board;
