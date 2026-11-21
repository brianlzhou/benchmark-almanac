// Terminal-Bench 2.1 (announced 2026-05-06): a separate registry package with its own "main" board.
// Includes the published pass@k, run token totals and reward hacks for each run.
import { makeTerminalBench, TERMINAL_BENCH_STATS } from '../lib/boards/terminal-bench.ts';

const board = makeTerminalBench({
  benchmark: 'terminal-bench-2-1',
  version: '2.1',
  pkg: 'terminal-bench/terminal-bench-2-1',
  name: 'main',
  // the 2.1 feed carries the same cost, tokens, pass@k, interval and trial time as 4.0
  extras: true,
});
const { successes: _successes, ...terminalBench21Stats } = TERMINAL_BENCH_STATS;
board.stats = terminalBench21Stats;
export default board;
