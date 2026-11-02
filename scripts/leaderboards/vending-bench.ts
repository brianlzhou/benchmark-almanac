// Vending-Bench (the first version, deprecated by Andon Labs in November 2025 for Vending-Bench 2) on
// andonlabs.com. The eval page is server-rendered with one leaderboard table: Model | Net worth (mean) |
// Net worth (min) | units sold and days until sales stop. Mean net worth in US dollars is the score, the
// almanac's unit for this benchmark. A "New" badge after a name is dropped, and the human baseline row is
// skipped. The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://andonlabs.com/evals/vending-bench';

const board: Leaderboard = {
  benchmark: 'vending-bench',
  url: URL,
  feed: `${URL} (leaderboard table, Net worth (mean))`,
  terms: 'Server-rendered public page of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  aliases: {},
  fetch: () =>
    tableRows(URL, {
      model: /^Model$/i,
      score: /^Net worth \(mean\)$/i,
      skip: /^(Human|Random)/i,
      name: (c) => c.text.replace(/\s+New$/, ''),
    }),
};
export default board;
