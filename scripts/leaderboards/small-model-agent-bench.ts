// Small Model Agent Bench (Kaggle Benchmarks, by cacinie): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'small-model-agent-bench',
  url: 'https://www.kaggle.com/benchmarks/cacinie/smab-small-model-agent-bench',
  feed: kaggleFeed('cacinie', 'smab-small-model-agent-bench'),
  terms: KAGGLE_TERMS,
  parts: {
    arguments: 'Arguments',
    overall: 'Overall task',
    relevance: 'Relevance',
    selection: 'Selection',
    planning: 'Planning',
    stateTracking: 'State tracking',
    stopping: 'Stopping',
  },
  fetch: () => kaggleRowsWithBounds('cacinie', 'smab-small-model-agent-bench', "(Overall)", 100, {
    arguments: { task: 'smab_arguments', scale: 100 },
    overall: { task: 'smab_overall', scale: 100 },
    relevance: { task: 'smab_relevance', scale: 100 },
    selection: { task: 'smab_selection', scale: 100 },
    planning: { task: 'smab_planning', scale: 100 },
    stateTracking: { task: 'smab_state_tracking', scale: 100 },
    stopping: { task: 'smab_stopping', scale: 100 },
  }),
};
export default board;
