// IndicQA is a multilingual cloze-style reading-comprehension benchmark.
// Table 22 of the benchmark paper reports average F1 across its IndicQA languages.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2023.acl-long.693.pdf';
const board: Leaderboard = {
  benchmark: 'indicqa', url: 'https://aclanthology.org/2023.acl-long.693/', feed, static: 'paper',
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const p = await pdfText(feed);
    if (!p.includes('Table 22: Results on IndicQA task')) throw new Error('IndicQA Table 22 missing');
    return checked([
      { model: 'mBERT', score: 32.9 }, { model: 'XLMR', score: 44.8 }, { model: 'MuRIL', score: 47.7 },
      { model: 'v1-data', score: 37.6 }, { model: 'IndicBERT', score: 48.3 },
      { model: 'IndicBERT + Samanantar', score: 49.2 }, { model: 'IndicBERT + Back-Trans', score: 42.2 },
      { model: 'IndicBERT-SS', score: 49.7 },
    ], 8);
  },
};
export default board;
