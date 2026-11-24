// Models repair physics simulators. Prime reports the mean reward for each scored evaluation run.
// The public leaderboard initially compared five models on four examples per run.
import type { Leaderboard } from './types.ts';
import { primeFeed, primeRows } from './gpu-puzzles.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const env = 'x7651g0yk2q1auscdi6f1szo';
const url = 'https://app.primeintellect.ai/dashboard/environments/kishanpb/physgym-arena-drhard-public/evals';
const board: Leaderboard = {
  benchmark: 'physgym-arena-dr-hard', url, feed: primeFeed(env),
  terms: 'Prime Intellect hosts the public evaluations under https://www.primeintellect.ai/terms-of-service.',
  headline: 'The original leaderboard runs each scored four examples from the 50-example environment.',
  async fetch() { return checked(await primeRows(url, env, 1, 5), 5); },
};
export default board;
