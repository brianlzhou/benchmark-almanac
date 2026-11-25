// Models reconstruct a picture from row and column clues in one reply. The score averages the share of exact solutions across six tiers.
// The game API supplies each contestant's overall result and usage.
import type { Leaderboard } from './types.ts';
import { crestGame } from './crest-arcade-freecell.ts';

const board: Leaderboard = {
  benchmark: 'crest-arcade-nonograms',
  url: 'https://glimmerindex.com/bench#nonograms',
  feed: 'https://glimmerindex.com/api/bench/nonograms',
  parts: { '5x5': '5 by 5', '10x10': '10 by 10', '15x15': '15 by 15', '20x20': '20 by 20', '25x25': '25 by 25', beyond: 'Beyond' },
  stats: { attempts: { name: 'Attempts', unit: 'count' }, aborted: { name: 'Aborted attempts', unit: 'count' }, solved: { name: 'Puzzles solved', unit: 'count', better: 'higher' }, solve_rate: { name: 'Solve rate', unit: 'score', better: 'higher' }, cell_accuracy: { name: 'Cell accuracy', unit: 'score', better: 'higher' }, cells: { name: 'Cells', unit: 'count' }, line_accuracy: { name: 'Line accuracy', unit: 'score', better: 'higher' }, near_misses: { name: 'Near misses', unit: 'count', better: 'lower' }, confidence_given: { name: 'Confidence when answering', unit: 'score', better: 'higher' }, confidence_mean: { name: 'Mean confidence', unit: 'score', better: 'higher' }, confidence_when_unsolved: { name: 'Confidence when unsolved', unit: 'score', better: 'higher' }, confident_and_wrong: { name: 'Confident wrong answers', unit: 'count', better: 'lower' }, brier: { name: 'Brier score', unit: 'brier', better: 'lower' }, retries: { name: 'Retries', unit: 'count', better: 'lower' }, truncated_rate: { name: 'Truncated response rate', unit: 'score', better: 'lower' }, inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' }, reasoningTokens: { name: 'Reasoning tokens', unit: 'tokens', better: 'lower' }, seconds_per_puzzle: { name: 'Seconds per puzzle', unit: 'seconds', better: 'lower' }, cost_total: { name: 'Total cost', unit: 'usd', better: 'lower' }, cost_per_solve: { name: 'Cost per solve', unit: 'usd', better: 'lower' } },
  terms: 'Glimmer Index permits use with credit. https://glimmerindex.com/bench#nonograms-method The site allows all paths in robots.txt.',
  fetch: () => crestGame(board, {"minimum": 15, "count": "attempts", "cost": "cost_per_puzzle", "tokens": "tokens_out_per_puzzle", "latency": "seconds_per_puzzle", "date": "last_attempt", "tierMetric": "rate", "tierScale": 100.0}),
};
export default board;
