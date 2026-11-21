// IMB tests open-ended medical QA and multiple-choice medical knowledge in Italian.
// Table 8 reports BERTScore and other generation measures on the 20% IMB-QA evaluation split.
// Figure 6 shows eight of 60 multiple-choice specialties and gives no whole-track accuracy.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2510.18468';
const columns = ['ROUGE-1', 'ROUGE-2', 'ROUGE-L', 'BLEU', 'METEOR', 'BERTScore P', 'BERTScore R', 'BERTScore F1'];
const board: Leaderboard = {
  benchmark: 'imb', url: feed, feed, static: 'paper',
  terms: 'The IMB project specifies CC BY-NC-ND 4.0 at https://github.com/PRAISELab-PicusLab/IMB#-license.',
  headline: 'The paper gives no combined score. This is BERTScore precision on the open-ended IMB-QA track, expressed as a percentage.',
  parts: { openQA: { name: 'IMB-QA', unit: '%', note: 'BERTScore precision as a percentage.' } },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === ['Model', 'Fine-Tuned', ...columns].join('|'));
    if (!table) throw new Error('Missing IMB-QA comparison');
    return checked(table.slice(1).map(row => {
      if (row.length !== 10 || !['Yes', 'No'].includes(row[1])) throw new Error('Invalid IMB-QA row');
      const metrics = Object.fromEntries(columns.map((name, i) => [name, numberCell(row[i + 2])]));
      const score = Number((100 * metrics['BERTScore P']).toFixed(4));
      return { model: row[0], setting: row[1] === 'Yes' ? 'Fine-tuned on IMB-QA' : 'Without IMB-QA fine-tuning',
        score, metrics: { ...metrics, openQA: score } };
    }), 8);
  },
};
export default board;
