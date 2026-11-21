// DREsS tests rubric-based automated essay scoring. Table 3 reports total quadratic weighted kappa (QWK).
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.acl-long.659.pdf';
const board: Leaderboard = {
  benchmark: 'dress-essay-scoring', static: 'paper', url: 'https://aclanthology.org/2025.acl-long.659/', feed,
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  stats: { content: { name: 'Content score', unit: 'score', better: 'higher' }, language: { name: 'Language score', unit: 'score', better: 'higher' }, organization: { name: 'Organization score', unit: 'score', better: 'higher' } },
  async fetch() {
    const text = await pdfText(feed);
    if (!/ArTS \(Do et al\., 2024\)[\s\S]{0,180}?0\.690/.test(text) || !/Llama 3\.1 8B \(Grattafiori et al\., 2024\)[\s\S]{0,180}?0\.691/.test(text)) throw new Error('Missing DREsS Table 3');
    return checked([
      { model: 'EASE (SVR)', score: 0.360 }, { model: 'NPCR', score: 0.507 }, { model: 'ArTS', setting: 'SFT w/ DREsS', score: 0.690, metrics: { content: 0.601, organization: 0.743, language: 0.592 } },
      { model: 'BERT', score: 0.685, metrics: { content: 0.642, organization: 0.750, language: 0.607 } }, { model: 'Llama 3.1 8B', score: 0.691, metrics: { content: 0.631, organization: 0.771, language: 0.589 } },
      { model: 'gpt-4o', setting: 'zero-shot ICL', score: 0.304, metrics: { content: 0.310, organization: 0.322, language: 0.231 } }, { model: 'gpt-4o', setting: 'five-shot ICL', score: 0.428, metrics: { content: 0.361, organization: 0.475, language: 0.367 } }, { model: 'gpt-4o', setting: 'rubric explanation', score: 0.259, metrics: { content: 0.285, organization: 0.250, language: 0.200 } }, { model: 'gpt-4o', setting: 'feedback generation', score: 0.290, metrics: { content: 0.313, organization: 0.268, language: 0.230 } },
    ], 9);
  },
};
export default board;
