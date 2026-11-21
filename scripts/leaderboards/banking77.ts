// BANKING77 measures intent classification accuracy on banking questions.
// MTEB's Banking77Classification task feed gives the test accuracy as a fraction.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { taskScores } from './aila-statute-retrieval.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/Banking77Classification/scores';
const board: Leaderboard = {
  benchmark: 'banking77', url: 'https://mteb-leaderboard.hf.space/tasks/Banking77Classification', feed, host: 'MTEB',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    return checked(await taskScores(feed, 'Banking77Classification', 'accuracy', 272, 100), 272);
  },
};
export default board;
