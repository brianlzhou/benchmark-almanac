// LLM Economist measures how much social welfare a planner reaches in a simulated economy.
// The paper's 5,000-step comparison reports welfare as a percentage of the maximum.
// This importer reads the three named language-model baselines from the paper PDF.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2507.15815';
// Table 1 ("LLM Performance Comparison") names the models this way, with "% Max SWF" after 5,000 steps
const expected: Record<string, string> = { 'Llama 3.1:8b': 'Llama 3.1 8B', 'GPT-3.5 Turbo': 'GPT-3.5 Turbo', 'GPT-4o': 'GPT-4o' };

const board: Leaderboard = {
  benchmark: 'llm-economist',
  static: 'paper',
  url: 'https://arxiv.org/abs/2507.15815',
  feed,
  terms: 'Paper results read from arXiv. https://arxiv.org/abs/2507.15815',
  async fetch(): Promise<LeaderboardRow[]> {
    const paper = await pdfText(feed);
    const table = paper.split('Table 1. LLM Performance Comparison')[1]?.split(/\n\s*\n\s*\n/)[0];
    if (!table || !/% Max SWF/.test(table)) throw new Error('Missing LLM Economist Table 1');
    const rows: LeaderboardRow[] = [];
    for (const [name, model] of Object.entries(expected)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = table.match(new RegExp('(?:^|\\n)\\s*' + escaped + '\\s+5000\\s+(\\d+(?:\\.\\d+)?)\\s*(?:\\n|$)'));
      if (!match) throw new Error('Missing LLM Economist result: ' + name);
      rows.push({ model, score: Number(match[1]) });
    }
    return checked(rows, 3);
  },
};

export default board;
