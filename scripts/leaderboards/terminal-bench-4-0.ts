// Terminal-Bench 4.0 reads every effort, its successes, costs, token totals and trial durations from Harbor.
import { makeTerminalBench } from '../lib/boards/terminal-bench.ts';

export { HARBOR_FEED, label, makeTerminalBench, type Link } from '../lib/boards/terminal-bench.ts';

export default makeTerminalBench({
  benchmark: 'terminal-bench-4-0',
  version: '4.0',
  pkg: 'terminal-bench/terminal-bench',
  name: '4-0-0',
  extras: true,
});
