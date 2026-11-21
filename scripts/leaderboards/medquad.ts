// MedQuAD evaluates retrieval and question entailment for consumer health questions.
// Table 6 reports the LiveQA average score for four named systems on LiveQA'17.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6805558/fullTextXML';
const board: Leaderboard = { benchmark: 'medquad', static: 'paper', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6805558/', feed: FEED, terms: 'The article is published under the PMC license terms. Source attribution applies.', async fetch() { const x = await fetchText(FEED); if (!x.includes('LiveQA Measures')) throw new Error('MedQuAD Table 6 missing'); return [{model:'IR-based System',score:0.711},{model:'IR+RQE System',score:0.827},{model:"LiveQA'17 Best Results",score:0.637},{model:"LiveQA'17 Median Results",score:0.431}] satisfies LeaderboardRow[]; } };
export default board;
