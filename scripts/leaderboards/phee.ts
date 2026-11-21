// PHEE tests pharmacovigilance event extraction from biomedical abstracts.
// Tables 4 and 5 report trigger and argument F1 for three named systems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://aclanthology.org/2022.emnlp-main.376.pdf';
const board: Leaderboard = { benchmark: 'phee', static: 'paper', url: 'https://aclanthology.org/2022.emnlp-main.376/', feed: FEED, terms: 'ACL Anthology papers are available under ACL terms. https://aclanthology.org/info/license/', async fetch() { const p = await pdfText(FEED); if (!p.includes('Table 5: Results for arguments extraction')) throw new Error('PHEE tables missing'); return [ ['Seq Labelling', 90.69, 67.98, 59.61, 73.16], ['Extractive QA', 85.61, 70.71, 65.70, 75.92], ['Generative QA', 95.16, 68.25, 68.60, 80.04] ].map(([model, score, trigI, argEm, argTok]) => ({ model: model as string, score: score as number, metrics: { trigI: trigI as number, argumentEmF1: argEm as number, argumentTokenF1: argTok as number } })); } };
export default board;
