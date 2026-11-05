// LiveClawBench on mosi-ai.github.io. The leaderboard page is static HTML whose first table lists Rank |
// Model | Overall Avg Score | Best Score | Runs. The overall average over runs (0 to 100) is the score. The
// model cell holds the model name over its maker, so only the first line is kept. The reader lives in
// visulogic.ts. Best Score, the best single run, is kept as `best`.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://mosi-ai.github.io/LiveClawBench/leaderboard/';

const board: Leaderboard = {
  benchmark: 'liveclawbench',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Static GitHub Pages site with no robots.txt and no terms; the scores are cited to the LiveClawBench authors.',
  aliases: {},
  fetch: () =>
    tableRows(URL, {
      model: /^Model$/i,
      score: /^Overall Avg Score/i,
      metrics: { best: /^Best Score/i },
      name: (c) => text(c.html.match(/<div[^>]*>([^<]+)<\/div>/)?.[1] ?? c.text),
    }),
};
export default board;
