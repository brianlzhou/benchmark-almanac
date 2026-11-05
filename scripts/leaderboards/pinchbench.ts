// PinchBench 1.x on pinchbench.com, read at version 1.2.1, the last v1 release before PinchBench 2.0
// (2026-05-06) changed the task set and the judge. The reader lives in pinchbench-2.ts. As on the 2.0 board,
// average_cost_usd is the cost of one full run of every task (costPer 'run'), and the average execution time
// per run is metrics.time (seconds), which the page's "Success Rate vs. Execution Time" scatter plots.
import type { Leaderboard } from './types.ts';
import { PINCH_ALIASES, PINCH_TERMS, pinchPage, pinchRows } from './pinchbench-2.ts';

const VERSION = '1.2.1';

const board: Leaderboard = {
  benchmark: 'pinchbench',
  url: pinchPage(VERSION),
  feed: `${pinchPage(VERSION)} (Next.js flight data, "entries")`,
  terms: PINCH_TERMS,
  aliases: PINCH_ALIASES,
  costPer: 'run',
  chart: {
    title: 'Success Rate vs. Execution Time',
    note: 'Each point is one model: its average score against its average execution time for a full run, over its official submissions.',
    x: { key: 'time', label: 'Execution time per run', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Success rate', unit: '%', better: 'higher' },
  },
  fetch: () => pinchRows(VERSION, true),
};
export default board;
