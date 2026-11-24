// BashBench tests shell agents on system administration tasks. Section 2 gives the
// percentage of tasks each standalone model solves. Tables 1 and 2 compare control protocols.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2504.10374';
const board: Leaderboard = {
  benchmark: 'bashbench',
  url: 'https://www.bashcontrol.com/',
  feed,
  static: 'paper',
  aliases: { "GPT-4o mini (snapshot unspecified)": "gpt-4o-mini" },
  terms: 'The authors publish these results on arXiv under the terms linked at https://arxiv.org/abs/2504.10374.',
  async fetch() {
    const html = await paperHtml(feed);
    const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(match => text(match[1]));
    const rows = ['GPT-4o mini', 'Llama-3.1-8B'].map(model => {
      const paragraph = paragraphs.find(line => line.includes(model) && /solves \d+(?:\.\d+)?% of (?:the )?tasks/.test(line));
      const match = paragraph?.match(/solves (\d+(?:\.\d+)?)% of (?:the )?tasks/);
      if (!match) throw new Error('Missing standalone task completion rate for ' + model);
      return { model, score: Number(match[1]) };
    });
    return checked(rows, 2);
  },
};
export default board;
