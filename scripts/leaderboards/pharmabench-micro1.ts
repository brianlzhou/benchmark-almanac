// PharmaBench (micro1). A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["pharma-bench"], read as data. Its default tab,
// Pass rate (0 to 100), is the score.
import type { Leaderboard } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/pharma-bench';

const board: Leaderboard = {
  benchmark: 'pharmabench-micro1',
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "pharma-bench", Pass rate)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch() {
    const rows = await micro1Data(PAGE, 'pharma-bench');
    await new Promise(resolve => setTimeout(resolve, 1100));
    const means = new Map((await micro1Data(PAGE, 'pharma-bench', 'mean')).map(r => [r.model, r.score]));
    return rows.map(r => ({...r, metrics: means.has(r.model) ? {meanScore: means.get(r.model)!} : undefined}));
  },
};
export default board;
