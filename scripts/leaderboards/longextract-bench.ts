// LongExtract-Bench (Reducto x micro1). The board ranks extraction products and three frontier models called directly. A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["long-extraction"], read as data. Its default tab,
// Recall (0 to 100), is the score.
import type { Leaderboard } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/long-extraction';

const board: Leaderboard = {
  benchmark: 'longextract-bench',
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "long-extraction", Recall)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  fetch: () => micro1Data(PAGE, 'long-extraction'),
};
export default board;
