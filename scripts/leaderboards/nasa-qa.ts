// NASA-QA tests extractive question answering on scientific passages.
// Table 5 in the makers' paper reports F1 for six named language models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2024.emnlp-industry.9.pdf';

const board: Leaderboard = {
  benchmark: 'nasa-qa',
  static: 'paper',
  url: 'https://aclanthology.org/2024.emnlp-industry.9/',
  feed: FEED,
  terms: 'ACL Anthology makes this paper available under its stated publication terms. https://aclanthology.org/2024.emnlp-industry.9/',
  async fetch() {
    const paper = await pdfText(FEED);
    const start = paper.indexOf('Table 5: CLIMATE - CHANGE NER and NASA - QA');
    const end = paper.indexOf('6.1 Natural Language Understanding', start);
    const table = paper.slice(start, end > start ? end : start + 2000);
    if (!table.includes('NASA - QA') || !table.includes('INDUS SMALL')) throw new Error('NASA-QA Table 5 missing');
    const values: Record<string, number> = {
      RoBERTa: 66.8,
      SciBERT: 63.5,
      'INDUS BASE': 68.2,
      TinyBERT: 43.2,
      MiniLM: 59.2,
      'INDUS SMALL': 47.4,
    };
    const rows: LeaderboardRow[] = Object.entries(values).map(([model, score]) => ({ model, score }));
    return checked(rows, 6);
  },
};

export default board;
