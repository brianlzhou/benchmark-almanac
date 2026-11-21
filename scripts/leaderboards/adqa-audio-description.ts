// ADQA evaluates generated audio descriptions by question answering with context.
// Table 5 reports Correct answer using Context for narrative understanding on CMD-AD and MAD-eval.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.emnlp-main.1199.pdf';
const board: Leaderboard = {
  benchmark: 'adqa-audio-description', url: 'https://katha-ai.github.io/projects/adqa/', feed, static: 'paper',
  terms: 'The ACL Anthology publishes this paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const text = await pdfText(feed);
    const rows = [
      { model: 'AutoAD-III', score: 63.5, setting: 'CMD-AD, narrative understanding' },
      { model: 'UniAD', score: 63.2, setting: 'CMD-AD, narrative understanding' },
      { model: 'AutoAD-Zero', score: 63.2, setting: 'CMD-AD, narrative understanding' },
      { model: 'Q2VL', score: 51.5, setting: 'CMD-AD, narrative understanding' },
      { model: 'NarrAD', score: 52.4, setting: 'MAD-eval, narrative understanding' },
    ];
    return checked(rows, 5);
  },
};
export default board;
