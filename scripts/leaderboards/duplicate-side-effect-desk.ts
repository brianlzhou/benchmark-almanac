// Duplicate Side Effect Desk tests whether agents avoid paying the same refund twice.
// The source README reports mean reward on its 32-case evaluation split for three models.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/jigonyoo/duplicate-side-effect-desk';
const feed = 'https://raw.githubusercontent.com/jigonyoo/duplicate-side-effect-desk/main/README.md';

const board: Leaderboard = {
  benchmark: 'duplicate-side-effect-desk',
  url,
  feed,
  terms: 'MIT License. https://github.com/jigonyoo/duplicate-side-effect-desk/blob/main/LICENSE',
  async fetch() {
    const text = await fetchText(feed);
    const rows = [
      ['openai/gpt-4.1-mini', 0.959, 81, 14],
      ['anthropic/claude-haiku-4.5', 0.984, 91, 3],
      ['anthropic/claude-sonnet-4.5', 0.985, 92, 3],
    ].map(([model, score, perfect, duplicates]) => ({
      model: model as string,
      score: score as number,
      trials: 96,
      metrics: { perfectRollouts: perfect as number, duplicatePayments: duplicates as number },
    }));
    if (!text.includes('Measured models') || !text.includes('openai/gpt-4.1-mini')) {
      throw new Error('Measured model table missing from README');
    }
    return checked(rows, 3);
  },
};
export default board;
