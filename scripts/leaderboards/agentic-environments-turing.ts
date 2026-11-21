// Turing Agentic Environments measures agents across business and consumer application gyms.
// The headline is the site's average pass rate across the apps each model was run on.
// This importer reads the six-model frontier leaderboard embedded in the public page HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://agentic.turing.com/';
const board: Leaderboard = {
  benchmark: 'agentic-environments-turing',
  url: PAGE,
  feed: `${PAGE} (embedded Frontier leaderboard)`,
  terms: 'Turing labels the dataset confidential and proprietary. The public page publishes the six aggregate pass rates, which are credited to Turing.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
    const expected: [string, number][] = [
      ['Claude Opus 4.7', 60.2], ['Gemini 3.1 Pro', 59.6], ['GPT-5.4', 57.0],
      ['Claude Opus 4.6', 54.5], ['Gemini 3.1 Flash Lite', 45.6], ['Gemini 3.0 Flash', 32.5],
    ];
    for (const [model, score] of expected) {
      const escaped = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`${escaped}\\s+${score.toFixed(1)}\\s+%`).test(text)) throw new Error(`Turing Agentic Environments: missing ${model} leaderboard row`);
    }
    return expected.map(([model, score]) => ({ model, score }));
  },
};
export default board;
