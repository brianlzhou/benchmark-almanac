// Crest Arcade Sudoku scores completed grids across seven difficulty tiers. The puzzle API supplies solve rates, score intervals and cost and tokens per puzzle.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const FEED = "https://glimmerindex.com/api/bench/sudoku";

const board: Leaderboard = {
  benchmark: "crest-arcade-sudoku",
  url: "https://glimmerindex.com/bench#sudoku",
  feed: FEED,
  stats: { attempts: { name: 'Attempts', unit: 'count' }, expected: { name: 'Expected attempts', unit: 'count' }, aborted: { name: 'Aborted attempts', unit: 'count' }, solved: { name: 'Puzzles solved', unit: 'count', better: 'higher' }, solve_rate: { name: 'Solve rate', unit: 'score', better: 'higher' }, score: { name: 'Score', unit: 'score', better: 'higher' }, cell_accuracy: { name: 'Cell accuracy', unit: 'score', better: 'higher' }, cells: { name: 'Cells', unit: 'count' }, rule_breaking: { name: 'Rule breaking moves', unit: 'count', better: 'lower' }, near_misses: { name: 'Near misses', unit: 'count', better: 'lower' }, confidence_given: { name: 'Confidence when answering', unit: 'score', better: 'higher' }, confidence_mean: { name: 'Mean confidence', unit: 'score', better: 'higher' }, confidence_when_unsolved: { name: 'Confidence when unsolved', unit: 'score', better: 'higher' }, confident_and_wrong: { name: 'Confident wrong answers', unit: 'count', better: 'lower' }, brier: { name: 'Brier score', unit: 'brier', better: 'lower' }, retries: { name: 'Retries', unit: 'count', better: 'lower' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' }, outputTokens: { name: 'Output tokens', unit: 'tokens', better: 'lower' }, reasoningTokens: { name: 'Reasoning tokens', unit: 'tokens', better: 'lower' }, seconds_per_puzzle: { name: 'Seconds per puzzle', unit: 'seconds', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' }, cost_per_puzzle: { name: 'Cost per puzzle', unit: 'usd', better: 'lower' }, cost_per_solve: { name: 'Cost per solve', unit: 'usd', better: 'lower' } },
  terms: "Glimmer Index permits use with credit. https://glimmerindex.com/bench#sudoku-method Glimmer Index allows all paths in robots.txt.",
  async fetch() {
    return crestGame(board, {"minimum": 18, "count": "attempts", "cost": "cost_per_puzzle", "tokens": "tokens_out_per_puzzle", "latency": "seconds_per_puzzle", "date": "last_attempt", "tierMetric": "rate", "tierScale": 100});
  },
};
export default board;
