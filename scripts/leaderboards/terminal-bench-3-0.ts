// Terminal-Bench 3.0 publishes total run costs. It has no trial time for the Pareto chart.
import type { Leaderboard } from './types.ts';
import { makeTerminalBench } from './terminal-bench-4-0.ts';
import { TERMINAL_BENCH_STATS } from '../lib/boards/terminal-bench.ts';

const board: Leaderboard = {
  ...makeTerminalBench({
    benchmark: 'terminal-bench-3-0',
    version: '3.0',
    pkg: 'terminal-bench/terminal-bench',
    name: '3-0-0',
    extras: true,
    costPer: 'run',
  }),
  stats: {
    runCostUsd: TERMINAL_BENCH_STATS.runCostUsd,
    runTotalTokens: TERMINAL_BENCH_STATS.runTotalTokens,
  },
  chart: undefined,
};
export default board;
