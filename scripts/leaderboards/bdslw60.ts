// BdSLW60 tests recognition of 60 Bangla signs from video. Tables 5 and 6 report
// accuracy on two held-out signers. Avg CV is the cross-validation accuracy with flipping.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://arxiv.org/pdf/2402.08635';
const board: Leaderboard = {
  benchmark: 'bdslw60',
  static: 'paper',
  url: 'https://arxiv.org/abs/2402.08635',
  feed,
  terms: 'The authors publish these tables on arXiv under the terms listed at https://arxiv.org/abs/2402.08635.',
  async fetch() {
    const text = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string, cells: string[]) {
      for (const [i, landmarks] of [543, 75].entries()) {
        const [flipped, original, cv] = cells.slice(i * 3, i * 3 + 3);
        for (const [augmentation, value] of [['flipped', flipped], ['original', original]]) {
          if (!value || value === '—') continue;
          if (!/^\d+(\.\d+)?$/.test(value)) throw new Error('Unexpected test accuracy');
          rows.push({
            model, score: Number(value), setting: [setting, landmarks + ' landmarks', augmentation].join(', '),
            metrics: augmentation === 'flipped' && cv ? { avgCV: Number(cv) } : undefined,
          });
        }
      }
    }
    const traditional = text.split('Table 5: Test Accuracy of Traditional Classifiers')[1]?.split('DTW weights')[0];
    const neural = text.split('Table 6: Test Accuracy of Bi-LSTM with Attention')[1]?.split('1 Early stopping')[0];
    for (const table of [traditional, neural]) {
      if (!table?.match(/FLIPPED\s+ORIGINAL\s+Avg CV\d\s+FLIPPED\s+ORIGINAL\s+Avg CV/)) throw new Error('Missing accuracy columns');
    }
    for (const line of traditional!.split('\n').filter(line => line.startsWith('SVM'))) {
      const dtw = line.includes('DTW');
      const cells = line.trim().split(/\s{2,}/).slice(1);
      if (cells.length !== 6) throw new Error('Unexpected SVM row');
      add(dtw ? 'SVM +DTW' : 'SVM', dtw ? 'Linear kernel, non-prolonged' : 'Linear kernel, prolonged', cells);
    }
    for (const line of neural!.split('\n').filter(line => /^\d+,/.test(line))) {
      const config = line.slice(0, 18).match(/^(\d+),\s*200(?:\((?:p=)?(5)\))?,?\s*(RQ3)?\s*$/);
      if (!config) throw new Error('Unexpected Bi-LSTM training configuration');
      const bounds = [18, 33, 46, 60, 70, 82, 98];
      const cells = bounds.slice(0, -1).map((start, i) => line.slice(start, bounds[i + 1]).trim());
      const setting = ['Non-prolonged', 'batch ' + config[1], '200 epochs'];
      if (config[2]) setting.push('early stopping patience 5');
      if (config[3]) setting.push('relative quantization');
      add('Bi-LSTM with Attention', setting.join(', '), cells);
    }
    return checked(rows, 19);
  },
};
export default board;
