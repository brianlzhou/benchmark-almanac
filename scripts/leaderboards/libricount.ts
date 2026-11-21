// LibriCount tests how accurately a model counts speakers in a recording.
// The MTEB task leaderboard reports classification accuracy as a fraction.
import type { Leaderboard } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/LibriCount/scores';
const board: Leaderboard = {
  benchmark: 'libricount',
  host: 'MTEB',
  url: 'https://leaderboard.mteb.org/tasks/LibriCount',
  feed,
  terms: 'MTEB publishes results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const rows = await taskScores(feed, 'LibriCount', 'accuracy', 52, 100);
    return checked(rows.filter(row => row.model !== 'mteb/baseline-random-encoder'), 52);
  },
};
export default board;
