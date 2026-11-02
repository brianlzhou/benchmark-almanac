// ClockBench on clockbench.ai. The page is server-rendered with one leaderboard table: Rank | Model |
// Accuracy | Lab. Accuracy at reading analog clocks (0 to 100) is the score. Names may end in the reasoning
// effort ("Gemini 4 Argon High"), which the resolver reads as the setting. The two human baseline rows
// (top and average human performance) are skipped. The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://clockbench.ai/';

const board: Leaderboard = {
  benchmark: 'clockbench',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Server-rendered public page; robots.txt allows all paths for generic agents with a search=yes, ai-train=no content signal, and the site publishes no terms.',
  aliases: {
    // the board's own misspelling of GPT-5 Nano
    'GTP-5 Nano': 'gpt-5-nano',
    'Qwen 3-VL 235B Instruct': 'qwen3-vl-235b-a22b-instruct',
  },
  fetch: () => tableRows(URL, { model: /^Model$/i, score: /^Accuracy$/i, skip: /Human Performance/i }),
};
export default board;
