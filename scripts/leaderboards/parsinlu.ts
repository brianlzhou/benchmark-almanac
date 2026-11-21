// ParsiNLU tests Persian language understanding across several tasks.
// Table 4 reports the all-column multiple-choice score and other task scores for named models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://aclanthology.org/2021.tacl-1.68.pdf';
const board: Leaderboard = { benchmark: 'parsinlu', static: 'paper', url: 'https://aclanthology.org/2021.tacl-1.68/', feed: FEED, headline: 'The paper reports no overall score, so this is the multiple-choice all column, which it presents first.', terms: 'ACL Anthology papers are available under ACL terms. https://aclanthology.org/info/license/', async fetch() { const p = await pdfText(FEED); if (!p.includes('Table 4: Evaluation of Persian-only models')) throw new Error('ParsiNLU Table 4 missing'); const rows: LeaderboardRow[] = [ ['mBERT (base)',49.0],['WikiBERT (base)',39.2],['ParsBERT (base)',40.7],['mT5 (small)',30.9],['mT5 (base)',42.6],['mT5 (large)',49.2],['mT5 (XL)',70.4],['mT5 English (small)',33.0],['mT5 English (base)',53.4],['mT5 English (large)',67.4],['mT5 English (XL)',68.2],['mT5 Per + Eng (small)',45.3],['mT5 Per + Eng (base)',63.9],['mT5 Per + Eng (large)',73.6],['mT5 Per + Eng (XL)',74.7] ].map(([model,score])=>({model:model as string,score:score as number})); return rows; } };
export default board;
