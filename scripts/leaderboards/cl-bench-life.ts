// CL-bench Life on clbench.com: data/life-data.json, the same format as CL-bench (overall solve rate as a
// fraction, the default sort), read through the helper in cl-bench.ts.
import type { Leaderboard } from './types.ts';
import { CLBENCH_ALIASES, CLBENCH_TERMS, clbenchFeed, clbenchRows } from './cl-bench.ts';

const board: Leaderboard = {
  benchmark: 'cl-bench-life',
  url: 'https://www.clbench.com/',
  feed: clbenchFeed('life-data.json'),
  terms: CLBENCH_TERMS,
  aliases: CLBENCH_ALIASES,
  fetch: () => clbenchRows('life-data.json'),
};
export default board;
