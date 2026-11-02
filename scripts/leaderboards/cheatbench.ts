// CheatBench on cheatbench.ai. The page is server-rendered with one leaderboard table: Model | ten task
// columns | Average. Average (0 to 100) is the score. The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://www.cheatbench.ai/';

const board: Leaderboard = {
  benchmark: 'cheatbench',
  url: URL,
  feed: `${URL} (leaderboard table, Average)`,
  terms: 'Server-rendered public page; the site has no robots.txt and no terms.',
  aliases: {},
  fetch: () => tableRows(URL, { model: /^Model$/i, score: /^Average$/i }),
};
export default board;
