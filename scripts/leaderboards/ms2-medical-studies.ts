// MS² tests automatic summarization of systematic medical reviews.
// The paper reports ROUGE, evidence distance, and macro F1 for two named model architectures.
// This importer uses ROUGE-1 from Table 5 as the headline and keeps the other measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2021.emnlp-main.594.pdf';
const board: Leaderboard = {
  benchmark: 'ms2-medical-studies', static: 'paper', url: 'https://aclanthology.org/2021.emnlp-main.594/', feed,
  terms: 'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  headline: 'The paper reports ROUGE, evidence distance, and macro F1, so this headline is the ROUGE-1 column.',
  parts: { rouge1: 'ROUGE-1', rouge2: 'ROUGE-2', rougeL: 'ROUGE-L', deltaEI: 'Delta EI', f1: 'Macro F1' },
  async fetch(): Promise<LeaderboardRow[]> {
    const p = await pdfText(feed);
    if (!/BART\s+27\.56\s+9\.40\s+20\.80\s+\.459\s+46\.51/.test(p)) throw new Error('Missing MS2 Table 5');
    return checked([
      { model: 'BART', score: 27.56, metrics: { rouge1:27.56, rouge2:9.40, rougeL:20.80, deltaEI:0.459, f1:46.51 } },
      { model: 'LED', score: 26.89, metrics: { rouge1:26.89, rouge2:8.91, rougeL:20.32, deltaEI:0.449, f1:45.00 } },
    ], 2);
  },
};
export default board;
