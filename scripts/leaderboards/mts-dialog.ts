// MTS-Dialog evaluates clinical dialogue summarization into medical notes.
// The headline is macro-average ROUGE-1 F1 from Table 7, with the other reported metrics retained.
// Table 6 and Table 7 report four named BART model variants fine-tuned on MTS-Dialog.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://aclanthology.org/2023.eacl-main.168.pdf';
const board: Leaderboard = {
  benchmark: 'mts-dialog', static: 'paper', url: 'https://aclanthology.org/2023.eacl-main.168/', feed: URL,
  terms: 'ACL Anthology paper, available under its published license: https://aclanthology.org/info/license/',
  async fetch() {
    const text = await pdfText(URL);
    if (!text.includes('Table 7: Evaluation of the summarization models')) throw new Error('MTS-Dialog Table 7 missing');
    const rows: LeaderboardRow[] = [
      {model: 'BART-large', setting: 'Baseline', score: 0.3042, metrics: {rouge2: 0.1203, rougeL: 0.2691, factCore: 0.2381, factFull: 0.1643, bertScoreM1: 0.309, bertScoreM2: 0.285, bleurt20: 0.4316}},
      {model: 'BART-xsum-samsum', setting: 'PFT', score: 0.4015, metrics: {rouge2: 0.1804, rougeL: 0.3256, factCore: 0.3753, factFull: 0.2264, bertScoreM1: 0.383, bertScoreM2: 0.368, bleurt20: 0.5003}},
      {model: 'BART-xsum-samsum', setting: 'PFT + GS', score: 0.4204, metrics: {rouge2: 0.1759, rougeL: 0.3485, factCore: 0.3466, factFull: 0.2126, bertScoreM1: 0.419, bertScoreM2: 0.4, bleurt20: 0.5089}},
      {model: 'BART-xsum-samsum', setting: 'PFT + GS + DA', score: 0.4252, metrics: {rouge2: 0.175, rougeL: 0.349, factCore: 0.3496, factFull: 0.2128, bertScoreM1: 0.412, bertScoreM2: 0.408, bleurt20: 0.5123}},
    ];
    return checked(rows, 4);
  },
};
export default board;
