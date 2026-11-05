// BullshitBench V1. The V1 question set's leaderboard.csv under data/latest/ on the BullshitBench site, read
// with the V2 reader in bullshitbench-2.ts: clear pushback rate with refusals excluded, as the viewer ranks.
// Cost and output tokens per answer come from V1's own viewer_rows file, as for V2.
import type { Leaderboard } from './types.ts';
import { BS_ALIASES, BS_PAGE, BS_TERMS, bsRows } from './bullshitbench-2.ts';

const board: Leaderboard = {
  benchmark: 'bullshitbench',
  url: BS_PAGE,
  feed: `${BS_PAGE}data/latest/leaderboard.csv (clear pushback, refusals excluded) and viewer_rows (cost, output tokens)`,
  terms: BS_TERMS,
  aliases: BS_ALIASES,
  fetch: () => bsRows('data/latest/', true),
};
export default board;
