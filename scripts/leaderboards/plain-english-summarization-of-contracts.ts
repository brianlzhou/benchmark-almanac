// Plain English Summarization of Contracts tests extractive summarization of legal text.
// Table 6 reports ROUGE scores for five named baselines on the combined dataset.
// Random-K picks K sentences at random, so it is not a model and the board leaves it out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://aclanthology.org/W19-2201.pdf';
const board: Leaderboard = { benchmark: 'plain-english-summarization-of-contracts', notModels: /^Random-K$/, static: 'paper', url: 'https://aclanthology.org/W19-2201/', feed: FEED, headline: 'The paper reports ROUGE-1, ROUGE-2 and ROUGE-L, so this headline uses the first ROUGE-1 column.', terms: 'ACL Anthology papers are available under ACL terms. https://aclanthology.org/info/license/', stats: { rouge2: { name: 'ROUGE-2', unit: 'score', better: 'higher' }, rougeL: { name: 'ROUGE-L', unit: 'score', better: 'higher' } }, async fetch() { const p = await pdfText(FEED); if (!p.includes('Table 6: Performance for each dataset')) throw new Error('Contract summarization Table 6 missing'); return [ ['TextRank',24.03,7.16,17.10], ['KLSum',23.56,6.94,16.93], ['Lead-1',23.87,7.47,17.19], ['Lead-K',24.38,7.52,17.63], ['Random-K',22.32,6.33,16.09] ].map(([model,score,r2,rl])=>({model:model as string,score:score as number,metrics:{rouge2:r2 as number,rougeL:rl as number}})); } };
export default board;
