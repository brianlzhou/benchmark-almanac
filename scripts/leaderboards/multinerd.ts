// MultiNERD tests multilingual named-entity recognition.
// Table 4 reports span micro F1 across eight common test sets for five training datasets.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://aclanthology.org/2022.findings-naacl.60.pdf';
const board: Leaderboard = { benchmark: 'multinerd', static: 'paper', url: 'https://aclanthology.org/2022.findings-naacl.60/', feed: FEED, headline: 'The paper reports no overall score, so this is the plain mean of its eight common-test-set F1 scores.', terms: 'ACL Anthology papers are available under ACL terms. https://aclanthology.org/info/license/', async fetch() { const p = await pdfText(FEED); if (!p.includes('Table 4: Span-based micro F1 scores')) throw new Error('MultiNERD Table 4 missing'); const data: Record<string, number[]> = { WikiANN:[56.85,53.55,55.76,44.39,57.05,36.43,51.85,53.50], WikiNER:[73.05,75.07,74.75,64.03,81.98,71.16,65.99,62.31], WikiNEuRal:[76.94,77.87,77.40,64.02,82.42,71.98,66.50,62.44], 'MultiNERD w/o self-improvement':[69.75,71.04,70.58,57.99,76.88,65.12,60.41,58.43], 'MultiNERD (our work)':[77.11,78.20,77.84,65.22,83.11,72.45,67.39,62.94] }; return Object.entries(data).map(([model, values]) => ({ model, score: values.reduce((a,b)=>a+b,0)/values.length })); } };
export default board;
