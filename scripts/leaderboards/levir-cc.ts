// LEVIR-CC tests change captioning from pairs of remote sensing images.
// The source reports several caption metrics and no overall score, so this importer uses BLEU-4 as the headline.
// It reads the named model comparison in Table IX of the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://levir.buaa.edu.cn/publications/ChangeCaptioning.pdf';
const board: Leaderboard = {
  benchmark: 'levir-cc', static: 'paper',
  url: 'https://levir.buaa.edu.cn/datasets/', feed,
  terms: 'The paper is publicly available from the authors. Cite the paper when reusing its results.',
  headline: 'The paper reports several caption metrics, so this headline is its BLEU-4 column.',
  parts: { bleu1: 'BLEU-1', bleu2: 'BLEU-2', bleu3: 'BLEU-3', bleu4: 'BLEU-4', meteor: 'METEOR', rougeL: 'ROUGE-L', ciderD: 'CIDEr-D' },
  async fetch(): Promise<LeaderboardRow[]> {
    const p = await pdfText(feed);
    if (!/Capt-Rep-Diff \[12\]\s+72\.90\s+61\.98\s+53\.62\s+47\.41/.test(p)) throw new Error('Missing LEVIR-CC Table IX');
    const rows = [
      ['Capt-Rep-Diff',72.90,61.98,53.62,47.41,34.47,65.64,110.57], ['Capt-Att',77.64,67.40,59.24,53.15,36.58,69.73,121.22],
      ['Capt-Dual-Att',79.51,70.57,63.23,57.46,36.56,70.69,124.42], ['DUDA',81.44,72.22,64.24,57.79,37.15,71.04,124.32],
      ['MCCFormers-S',79.90,70.26,62.68,56.68,36.17,69.46,120.39], ['MCCFormers-D',80.42,70.87,62.86,56.38,37.29,70.32,124.44],
      ['Baseline',78.04,69.17,61.95,56.35,35.92,68.77,118.25], ['RSICCformer',84.72,76.27,68.87,62.77,39.61,74.12,134.12],
    ];
    return checked(rows.map(([model,b1,b2,b3,b4,meteor,rougeL,ciderD]) => ({ model: String(model), score: Number(b4), metrics: { bleu1:Number(b1), bleu2:Number(b2), bleu3:Number(b3), bleu4:Number(b4), meteor:Number(meteor), rougeL:Number(rougeL), ciderD:Number(ciderD) } })), 8);
  },
};
export default board;
