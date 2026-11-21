// RRN tests abstractive Icelandic news summarization.
// Table 2 in the makers' paper reports ROUGE F1 triplets for eight named models and training settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2023.nodalida-1.3.pdf';
const board: Leaderboard = {
  benchmark: 'rrn', static: 'paper', url: 'https://aclanthology.org/2023.nodalida-1.3/', feed: FEED,
  terms: 'ACL Anthology makes this paper available under its stated publication terms. https://aclanthology.org/2023.nodalida-1.3/',
  headline: 'The paper reports three summarization tasks, so this is the plain mean of their ROUGE-1 scores.',
  parts: { introMainSummary: 'Intro + Main → Summary', mainIntro: 'Main → Intro', introTitle: 'Intro → Title' },
  async fetch() {
    const paper = await pdfText(FEED);
    if (!paper.includes('Table 2: A comparison of GullfaxiBASE and mT5BASE')) throw new Error('RRN Table 2 missing');
    const data: [string, number[], number[]][] = [
      ['TransformerBASE (only fine-tuning)', [13.1, 10.8, 14.2], [1.3, 0.7, 0.6]],
      ['GullfaxiBASE (no fine-tuning)', [18.4, 16.8, 6.8], [2.9, 2.2, 1.1]],
      ['GullfaxiBASE (RRN)', [29.4, 20.5, 26.6], [10.2, 5.7, 5.8]],
      ['GullfaxiBASE (CNN/DailyMail)', [26.5, 17.8, 0], [9.0, 3.5, 0]],
      ['GullfaxiBASE (CNN/DailyMail + RRN)', [42.5, 22.2, 0], [21.3, 6.2, 0]],
      ['mT5BASE (RRN)', [54.9, 24.8, 27.1], [38.8, 11.2, 5.1]],
      ['mT5BASE (CNN/DailyMail)', [36.2, 21.4, 0], [19.3, 5.9, 0]],
      ['mT5BASE (CNN/DailyMail + RRN)', [58.9, 33.0, 0], [42.8, 17.0, 0]],
    ];
    const rows: LeaderboardRow[] = data.filter(([, scores]) => scores.every((x) => x > 0)).map(([model, scores, rest]) => ({
      model, score: scores.reduce((a, b) => a + b, 0) / scores.length,
      metrics: { introMainSummary: scores[0], mainIntro: scores[1], introTitle: scores[2], rouge2Mean: rest.reduce((a, b) => a + b, 0) / 3 },
    }));
    return checked(rows, 3);
  },
};
export default board;
