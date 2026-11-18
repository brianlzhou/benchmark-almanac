// Terminal-Bench 3.0 publishes total run costs. It has no trial time for the Pareto chart.
import type { Leaderboard } from './types.ts';
import { makeTerminalBench } from './terminal-bench-4-0.ts';

const board: Leaderboard = {
  ...makeTerminalBench({
    benchmark: 'terminal-bench-3-0',
    version: '3.0',
    pkg: 'terminal-bench/terminal-bench',
    name: '3-0-0',
    extras: true,
    costPer: 'run',
  }),
  chart: undefined,
};
export default board;
