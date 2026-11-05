// Terminal-Bench 3.0 (announced 2026-07-30). The reader lives in terminal-bench-4-0.ts. With `extras`, the
// 3.0 rows carry only the 95% confidence half-width (metrics.ci95, points): the board gives no cost, tokens
// or trial time for 3.0, so the Pareto chart that `extras` declares would be empty and is left out.
import type { Leaderboard } from './types.ts';
import { makeTerminalBench } from './terminal-bench-4-0.ts';

const board: Leaderboard = {
  ...makeTerminalBench({
    benchmark: 'terminal-bench-3-0',
    version: '3.0',
    pkg: 'terminal-bench/terminal-bench',
    name: '3-0-0',
    extras: true,
  }),
  chart: undefined,
};
export default board;
