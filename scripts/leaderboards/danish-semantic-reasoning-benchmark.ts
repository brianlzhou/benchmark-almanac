// The Danish Semantic Reasoning Benchmark tests six semantic tasks in Danish.
// The paper abstract reports average accuracy across all tasks for ChatGPT 3.5 turbo and ChatGPT 4.0.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2024.lrec-main.1421.pdf';
const board: Leaderboard = {
  benchmark: 'danish-semantic-reasoning-benchmark', feed, url: feed, static: 'paper',
  terms: 'ACL Anthology terms apply to the LREC paper. https://aclanthology.org/faq/copyright/',
  aliases: { 'ChatGPT 3.5 turbo': 'gpt-3-5-turbo', 'ChatGPT 4.0': 'gpt-4' },
  async fetch() {
    const paper = await pdfText(feed);
    const match = paper.replace(/\s+/g,' ').match(/average performance being relatively high with an average accuracy of ([\d.]+) on ChatGPT 3.5 turbo and ([\d.]+) on ChatGPT 4.0/);
    if (!match) throw new Error('Missing abstract accuracy summary');
    return checked([
      { model: 'ChatGPT 3.5 turbo', score: Number(match[1]) * 100, setting: 'Average across six tasks' },
      { model: 'ChatGPT 4.0', score: Number(match[2]) * 100, setting: 'Average across six tasks' },
    ], 2);
  },
};
export default board;
