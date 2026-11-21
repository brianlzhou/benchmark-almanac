// Backtracing retrieves the sentence that caused a query in lecture, news article and conversation text.
// The paper reports no overall score, so the headline is the plain mean of top-one accuracy across the three domains.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2024.findings-eacl.48.pdf';
const board: Leaderboard = {
  benchmark: 'backtracing', url: 'https://aclanthology.org/2024.findings-eacl.48/', feed,
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/', static: 'paper',
  headline: 'The paper reports no overall score, so this is the plain mean of top-one accuracy across Lecture, News Article and Conversation.',
  parts: { lecture: 'Lecture top-one accuracy', newsArticle: 'News Article top-one accuracy', conversation: 'Conversation top-one accuracy' },
  stats: { lectureTop3: { name: 'Lecture top-three accuracy', unit: '%', better: 'higher' }, newsArticleTop3: { name: 'News Article top-three accuracy', unit: '%', better: 'higher' }, conversationTop3: { name: 'Conversation top-three accuracy', unit: '%', better: 'higher' } },
  async fetch() {
    const p = await pdfText(feed);
    if (!p.includes('Bi-Encoder (all-MiniLM)') || !p.includes('gpt-3.5-turbo-16k')) throw new Error('Backtracing Table 2 missing');
    const rows: LeaderboardRow[] = [
      ['Edit', 'retrieval method', 4, 7, 1, 8, 18, 16],
      ['Bi-Encoder (Q&A)', 'retrieval method', 23, 48, 1, 37, 71, 15], ['Bi-Encoder (all-MiniLM)', 'retrieval method', 26, 49, 1, 40, 75, 37],
      ['Cross-Encoder', 'retrieval method', 22, 66, 1, 39, 85, 15], ['Re-ranker', 'retrieval method', 29, 66, 1, 44, 85, 21],
      ['gpt-3.5-turbo-16k', 'single-sentence', 15, 67, 47, 0, 0, 0], ['GPT2', 'single-sentence', 20, 43, 3, 34, 64, 46],
      ['GPTJ', 'single-sentence', 23, 67, 5, 42, 85, 65], ['OPT 6B', 'single-sentence', 30, 66, 2, 43, 82, 56],
      ['GPT2', 'autoregressive', 11, 9, 5, 16, 18, 54], ['GPTJ', 'autoregressive', 14, 55, 8, 24, 76, 60],
      ['OPT 6B', 'autoregressive', 16, 52, 18, 26, 73, 65], ['GPT2', 'ATE likelihood', 13, 51, 2, 21, 68, 24],
      ['GPTJ', 'ATE likelihood', 8, 67, 3, 18, 79, 18], ['OPT 6B', 'ATE likelihood', 9, 64, 3, 20, 76, 22],
    ].map(([model, setting, lecture, newsArticle, conversation, lecture3, newsArticle3, conversation3]) => ({
      model: String(model), setting: String(setting),
      score: Number(((Number(lecture) + Number(newsArticle) + Number(conversation)) / 3).toFixed(4)),
      metrics: { lecture: Number(lecture), newsArticle: Number(newsArticle), conversation: Number(conversation), lectureTop3: Number(lecture3), newsArticleTop3: Number(newsArticle3), conversationTop3: Number(conversation3) },
    }));
    return checked(rows, 15);
  },
};
export default board;
