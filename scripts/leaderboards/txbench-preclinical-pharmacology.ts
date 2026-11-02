// TxBench-Preclinical-Pharmacology on benchmarks.bio (LatchBio), read from the site's V1 results JSON through bioRows in
// biosecbench-refusal.ts (list "txbench-pp"). The score is the benchmark's macro-mean pass rate (0 to 100).
import type { Leaderboard } from './types.ts';
import { BIO_ALIASES, BIO_PAGE, BIO_TERMS, bioFeed, bioRows } from './biosecbench-refusal.ts';

const board: Leaderboard = {
  benchmark: 'txbench-preclinical-pharmacology',
  url: BIO_PAGE,
  feed: bioFeed('txbench-pp'),
  terms: BIO_TERMS,
  aliases: BIO_ALIASES,
  fetch: () => bioRows('txbench-pp'),
};
export default board;
