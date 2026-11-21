// ReplicationBench tests whether an agent can reproduce published astrophysics results.
// Table 2 gives unweighted scores averaged over six runs. Table 3 reports completion, median tokens and runtime.
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard } from './types.ts';
const feed = 'https://arxiv.org/html/2510.24591';
const board: Leaderboard = {
  benchmark: 'replicationbench', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 2 under the terms linked at https://arxiv.org/abs/2510.24591.',
  stats: {
    bestOfN: { name: 'Best-of-N score', unit: '%', better: 'higher' }, difficultyWeighted: { name: 'Difficulty-weighted score', unit: '%', better: 'higher' },
    tasksCompleted: { name: 'Tasks completed', unit: '%', better: 'higher' }, medianTokens: { name: 'Median tokens', unit: 'tokens', better: 'lower' }, medianRuntimeMinutes: { name: 'Median runtime', unit: 'minutes', better: 'lower' },
  },
  aliases: {'Gemini 2.5': 'gemini-2-5-pro-may-2025', 'Sonnet 3.7': 'claude-3-7-sonnet', 'Sonnet 4': 'claude-sonnet-4', 'Sonnet 4.5': 'claude-sonnet-4-5'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const scores = tables.find(t => t[0].join('|') === 'Model|Unweighted score|(standard dev.)|Best-of-N|Difficulty-weighted score');
    const usage = tables.find(t => t[0].join('|') === 'Model|Tasks completed|(standard dev.)|Median tokens (K)|Median runtime (min)');
    if (!scores || !usage) throw new Error('Missing ReplicationBench scores or usage columns');
    return checked(scores.slice(1).map(([model, ...cells]) => {
      const run = usage.find(r => r[0] === model);
      if (!run || cells.length !== 4) throw new Error('Incomplete ReplicationBench row for ' + model);
      const [score, std, bestOfN, weighted] = cells.map(v => 100 * numberCell(v));
      const [completion, completionStd, tokensK, minutes] = run.slice(1).map(numberCell);
      return {model, score, trials: 6, harness: 'Simple agent scaffold', metrics: {std, bestOfN, difficultyWeighted: weighted,
        tasksCompleted: 100 * completion, completionStd: 100 * completionStd, medianTokens: 1000 * tokensK, medianRuntimeMinutes: minutes}};
    }), 7);
  },
};
export default board;
