// Terminal-Bench 2.0 (announced 2025-11-07). The reader lives in terminal-bench-4-0.ts. `extras` keeps the row
// metrics the board has; on 2.0 that is only the 95% confidence half-width ("ci95"). The 2.0 rows carry no cost,
// tokens or time, so the Pareto chart that `extras` declares is dropped here.
import type { Leaderboard } from './types.ts';
import { makeTerminalBench } from './terminal-bench-4-0.ts';

const board: Leaderboard = {
  ...makeTerminalBench({
    benchmark: 'terminal-bench-2-0',
    version: '2.0',
    pkg: 'terminal-bench/terminal-bench-2',
    name: '2-0',
    extras: true,
    aliases: {
      'Claude 4.6 Opus': 'claude-opus-4-6',
      'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
      // the rows' model_names say moonshotai/Kimi-K2-Instruct-0905
      'Kimi K2 Instruct': 'kimi-k2-sep-2025',
      // model_names: Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8
      'Qwen 3 Coder 480B': 'qwen3-coder-480b-a35b',
    },
  }),
  chart: undefined,
};
export default board;
