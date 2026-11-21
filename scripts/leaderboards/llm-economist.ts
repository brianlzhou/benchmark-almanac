// LLM Economist measures how much social welfare a planner reaches in a simulated economy.
// The paper's 5,000-step comparison reports welfare as a percentage of the maximum.
// This importer reads the three named language-model baselines from the paper PDF.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2507.15815';
const expected: Record<string, number> = { 'GPT-4o': 98.2, 'GPT-3.5 Turbo': 97.84, 'Llama 3.1 8B': 90 };

const board: Leaderboard = {
  benchmark: 'llm-economist',
  static: 'paper',
  url: 'https://arxiv.org/abs/2507.15815',
  feed,
  terms: 'Paper results read from arXiv. https://arxiv.org/abs/2507.15815',
  async fetch(): Promise<LeaderboardRow[]> {
    const paper = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [model, score] of Object.entries(expected)) {
      const escaped = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(escaped + '[\\s\\S]{0,160}' + score.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')).test(paper)) {
        throw new Error('Missing LLM Economist result: ' + model);
      }
      rows.push({ model, score });
    }
    return checked(rows, 3);
  },
};

export default board;
