// Post-OCR Text Correction in Sanskrit tests correction of Devanagari OCR output.
// Table 2 reports character and word error rates for eight named models and encodings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://aclanthology.org/2022.findings-emnlp.466.pdf';
const board: Leaderboard = { benchmark: 'sanskrit-post-ocr-text-correction', static: 'paper', url: 'https://aclanthology.org/2022.findings-emnlp.466/', feed: FEED, headline: 'The source reports error rates, so the headline is character error rate and lower is better.', terms: 'ACL Anthology papers are available under ACL terms. https://aclanthology.org/info/license/', stats: { wer: { name: 'Word error rate', unit: '%', better: 'lower' } }, async fetch() { const p = await pdfText(FEED); if (!p.includes('Table 2: CER and WER')) throw new Error('Sanskrit Table 2 missing'); return [ ['OCR',30.23,3.89], ['mBART',26.11,3.50], ['mBART SLP1',26.60,3.71], ['IndicBART',25.73,3.55], ['CopyNet',50.38,13.25], ['mT5',26.47,3.53], ['mT5 SLP1',25.57,3.34], ['ByT5 SLP1',23.19,2.98] ].map(([model,wer,score])=>({model:model as string,score:score as number,metrics:{wer:wer as number}})); } };
export default board;
