// TxBench-Antibody-Discovery on benchmarks.bio (LatchBio), read from the site's V1 results JSON through bioRows in
// biosecbench-refusal.ts (list "txbench-ab"). The score is the benchmark's macro-mean pass rate (0 to 100).
import type { Leaderboard } from './types.ts';
import { BIO_ALIASES, BIO_PAGE, BIO_TERMS, bioFeed, bioRows } from './biosecbench-refusal.ts';

const board: Leaderboard = {
  benchmark: 'txbench-antibody-discovery',
  url: BIO_PAGE,
  feed: bioFeed('txbench-ab'),
  terms: BIO_TERMS,
  aliases: BIO_ALIASES,
  fetch: () => bioRows('txbench-ab'),
};
export default board;
