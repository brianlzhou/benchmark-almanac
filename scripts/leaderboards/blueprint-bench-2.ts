// Blueprint-Bench 2 on andonlabs.com. The eval page is server-rendered and carries the leaderboard as one
// HTML table: tier | Model | Score, where Score is the mean similarity of the model's floor plans to the
// true ones (0 to 1, shown here as 0 to 100 like the almanac's other percentages). The human baseline row
// ("Human*", measured on 12 apartments) is skipped. The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://andonlabs.com/evals/blueprint-bench-2';

const board: Leaderboard = {
  benchmark: 'blueprint-bench-2',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Server-rendered public page of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  aliases: {},
  fetch: () => tableRows(URL, { model: /^Model$/i, score: /^Score$/i, scale: 100, skip: /^(Human|Random)/i }),
};
export default board;
