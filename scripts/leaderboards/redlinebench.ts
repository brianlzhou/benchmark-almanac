// RedlineBench (Crosby x micro1). A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["contract"], read as data. Its default tab,
// Mean score (0 to 100), is the score.
import type { Leaderboard } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/crosby-micro1-redlinebench';

const board: Leaderboard = {
  benchmark: 'redlinebench',
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "contract", Mean score)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  fetch: () => micro1Data(PAGE, 'contract'),
};
export default board;
