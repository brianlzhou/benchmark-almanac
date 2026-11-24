// MAFAND-MT tests news-domain machine translation between English or French and 16 African languages.
// The score is BLEU averaged over the 16 directions, from the BLEU half of Table 3 in the NAACL 2022 paper, which
// fine-tunes eight pre-trained translation models on the benchmark's news data. The median BLEU stays beside it.
// M2M-100 zero-shot covers only some languages and has no average, so it has no row.
// The values are transcribed from the table, and the importer checks that each one still sits in the paper's text.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2022.naacl-main.223.pdf';
// [model, average BLEU, median BLEU], Table 3, BLEU
const ROWS: [string, number, number][] = [
  ['MT5', 7.2, 2.9],
  ['AfriMT5', 8.5, 4.8],
  ['ByT5', 10.9, 8.4],
  ['AfriByT5', 11.5, 9.1],
  ['mBART50', 13.2, 10.0],
  ['AfriMBART', 11.9, 9.9],
  ['M2M-100', 15.4, 13.6],
  ['M2M-100-EN/FR', 12.5, 9.2],
];

const board: Leaderboard = {
  benchmark: 'mafand-mt',
  static: 'paper',
  url: 'https://aclanthology.org/2022.naacl-main.223/',
  feed: FEED,
  terms: 'ACL Anthology papers are available under ACL terms. https://aclanthology.org/info/license/',
  stats: { median: { name: 'Median BLEU', unit: 'score', better: 'higher', note: 'The median over the 16 translation directions.' } },
  async fetch() {
    const text = await pdfText(FEED);
    if (!text.includes('Table 3: Results adding African Languages')) throw new Error('MAFAND-MT Table 3 missing');
    const lines = text.split('\n');
    return ROWS.map(([model, score, median]): LeaderboardRow => {
      // the first line for the model is its BLEU row, ending in the average and the median
      // (a number must follow the name, so "M2M-100 0-shot" isn't read as M2M-100)
      const start = new RegExp('^' + model.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\s+[\\d.]+\\s');
      const line = lines.find((l) => start.test(l.trim()));
      const nums = line?.trim().split(/\s+/).slice(-2).map(Number);
      if (!nums || nums[0] !== score || nums[1] !== median) throw new Error(`MAFAND-MT Table 3 changed for ${model}`);
      return { model, score, metrics: { median } };
    });
  },
};
export default board;
