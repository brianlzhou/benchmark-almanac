// Terminal-Bench 4.1 (2026-11-03): the 4.0 tasks with hardened verifiers, and the 4.0 runs regraded. Only rows the
// 4.1 board grades count here. Runs it hasn't regraded stay on Terminal-Bench 4.0.
import { makeTerminalBench } from './terminal-bench-4-0.ts';
import type { BoardStat } from './types.ts';

const stats: Record<string, BoardStat> = {
  passAt2: { name: 'Pass@2', unit: '%', better: 'higher' },
  passAt3: { name: 'Pass@3', unit: '%', better: 'higher' },
  passAt4: { name: 'Pass@4', unit: '%', better: 'higher' },
  passAt5: { name: 'Pass@5', unit: '%', better: 'higher' },
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
