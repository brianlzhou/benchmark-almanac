// CLARA-MeD tests Spanish medical text simplification. Table 3 reports SARI for six named fine-tuned models.
// SARI is the benchmark's primary simplification metric and is kept in the catalog score unit.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2024.lrec-main.1216.pdf';
const board: Leaderboard = {
  benchmark: 'clara-med-simplification', static: 'paper', url: 'https://aclanthology.org/2024.lrec-main.1216/', feed,
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const text = await pdfText(feed);
    if (!/BERTIN\s+41\.89\s+23\.19\s+35\.60\s+43\.07\s+15\.75/.test(text) || !/mBART\s+48\.82\s+31\.04\s+43\.96\s+50\.93\s+22\.90/.test(text)) throw new Error('Missing CLARA-MeD Table 3');
    return checked([
      { model: 'BERTIN', setting: 'Fine-tuning without lexicon', score: 43.07, metrics: { Rouge1: 41.89, Rouge2: 23.19, RougeL: 35.60, BLEU: 15.75 } },
      { model: 'MariMari', setting: 'Fine-tuning without lexicon', score: 47.08, metrics: { Rouge1: 42.47, Rouge2: 24.28, RougeL: 36.78, BLEU: 17.89 } },
      { model: 'mBART', setting: 'Fine-tuning without lexicon', score: 50.93, metrics: { Rouge1: 48.82, Rouge2: 31.04, RougeL: 43.96, BLEU: 22.90 } },
      { model: 'mT5', setting: 'Fine-tuning without lexicon', score: 40.46, metrics: { Rouge1: 34.20, Rouge2: 19.85, RougeL: 31.56, BLEU: 6.58 } },
      { model: 'NASES', setting: 'Fine-tuning without lexicon', score: 48.68, metrics: { Rouge1: 44.33, Rouge2: 26.51, RougeL: 38.54, BLEU: 20.47 } },
      { model: 'Pegasus XSUM', setting: 'Fine-tuning without lexicon', score: 41.65, metrics: { Rouge1: 43.78, Rouge2: 25.86, RougeL: 39.74, BLEU: 14.62 } },
    ], 6);
  },
};
export default board;
