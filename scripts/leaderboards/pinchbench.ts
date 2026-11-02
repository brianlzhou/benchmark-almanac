// PinchBench 1.x on pinchbench.com, read at version 1.2.1, the last v1 release before PinchBench 2.0
// (2026-05-06) changed the task set and the judge. The reader lives in pinchbench-2.ts.
import type { Leaderboard } from './types.ts';
import { PINCH_TERMS, pinchPage, pinchRows } from './pinchbench-2.ts';

const VERSION = '1.2.1';

const board: Leaderboard = {
  benchmark: 'pinchbench',
  url: pinchPage(VERSION),
  feed: `${pinchPage(VERSION)} (Next.js flight data, "entries")`,
  terms: PINCH_TERMS,
  aliases: {},
  fetch: () => pinchRows(VERSION),
};
export default board;
