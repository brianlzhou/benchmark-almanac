// Agents gather ingredients and prepare recipes in TextWorld Cooking.
// The Prime Intellect environment lists mean game reward for each public evaluation.
import type { Leaderboard } from './types.ts';
import { primeFeed, primeRows, primeTerms } from './gpu-puzzles.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const environment = 'kp1oyxpluvo83f0v80l9y12v';
const board: Leaderboard = {
  benchmark: 'textworld-cooking-gata',
  host: 'Prime Intellect',
  url: 'https://app.primeintellect.ai/dashboard/environments/bryonkucharski/textworld_cooking_env/evals',
  feed: primeFeed(environment),
  terms: primeTerms + ' https://www.primeintellect.ai/terms-of-service',
  stats: {
    runSeconds: { name: 'Run time', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    return checked(await primeRows(this.url, environment, 1, 2), 2);
  },
};
export default board;
