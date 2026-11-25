// Terminal-Bench 4.1 (2026-11-03): the 4.0 tasks with hardened verifiers, and the 4.0 runs regraded. Only rows the
// 4.1 board grades count here. Runs it hasn't regraded stay on Terminal-Bench 4.0.
import { makeTerminalBench } from './terminal-bench-4-0.ts';
import { TERMINAL_BENCH_STATS } from '../lib/boards/terminal-bench.ts';
import type { BoardStat } from './types.ts';

const stats: Record<string, BoardStat> = {
  passAt2: TERMINAL_BENCH_STATS.passAt2,
  passAt3: TERMINAL_BENCH_STATS.passAt3,
  passAt4: TERMINAL_BENCH_STATS.passAt4,
  passAt5: TERMINAL_BENCH_STATS.passAt5,
  successes: TERMINAL_BENCH_STATS.successes,
  runCachedInputTokens: TERMINAL_BENCH_STATS.runCachedInputTokens,
  runUncachedInputTokens: TERMINAL_BENCH_STATS.runUncachedInputTokens,
  runOutputTokens: TERMINAL_BENCH_STATS.runOutputTokens,
  runTotalTokens: TERMINAL_BENCH_STATS.runTotalTokens,
  runCostUsd: TERMINAL_BENCH_STATS.runCostUsd,
  time: { name: 'Mean time per trial', unit: 'seconds', better: 'lower' },
};

const board = makeTerminalBench({
  benchmark: 'terminal-bench-4-1',
  version: '4.1',
  pkg: 'terminal-bench/terminal-bench',
  name: '4-1-0',
  extras: true,
});
board.stats = stats;
export default board;
