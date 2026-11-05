// Terminal-Bench 2.1 (announced 2026-05-06): a separate registry package with its own "main" board.
// The reader lives in terminal-bench-4-0.ts.
import { makeTerminalBench } from './terminal-bench-4-0.ts';

export default makeTerminalBench({
  benchmark: 'terminal-bench-2-1',
  version: '2.1',
  pkg: 'terminal-bench/terminal-bench-2-1',
  name: 'main',
  // the 2.1 feed carries the same cost, tokens, pass@k, interval and trial time as 4.0
  extras: true,
});
