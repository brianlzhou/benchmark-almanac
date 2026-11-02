// RISEBench++ on the VisionXLab RISEBench leaderboard: English results, accuracy total, read through riseRows
// in risebench.ts, which explains the file and the rows left out.
import type { Leaderboard } from './types.ts';
import { RISE_ALIASES, RISE_FEED, RISE_TERMS, RISE_URL, riseRows } from './risebench.ts';

const board: Leaderboard = {
  benchmark: 'risebench-plus-plus',
  url: RISE_URL,
  feed: `${RISE_FEED} (risebench-plusplus, en, accuracy.total)`,
  terms: RISE_TERMS,
  aliases: RISE_ALIASES,
  fetch: () => riseRows('risebench-plusplus'),
};
export default board;
