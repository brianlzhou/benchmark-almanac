// AgentCallBench: Tool-Calling Reliability (Kaggle Benchmarks, by abhialex): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'agentcallbench-tool-calling-reliability',
  url: 'https://www.kaggle.com/benchmarks/abhialex/agentcallbench-tool-calling-reliability',
  feed: kaggleFeed('abhialex', 'agentcallbench-tool-calling-reliability'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('abhialex', 'agentcallbench-tool-calling-reliability', "(Overall)", 1),
};
export default board;
