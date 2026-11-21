// PatchCamelyon tests whether a histopathology image patch contains metastatic tissue.
// The MTEB task feed reports classification accuracy as a fraction. Display it as a percentage.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { MTEB_MODEL_STATS, taskScores } from './aila-statute-retrieval.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/PatchCamelyon/scores';
const board: Leaderboard = {
  benchmark: 'patchcamelyon', host: 'MTEB', feed, url: 'https://leaderboard.mteb.org/tasks/PatchCamelyon',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  stats: MTEB_MODEL_STATS,
  async fetch() {
    const rows = await taskScores(feed, 'PatchCamelyon', 'accuracy', 57, 100);
    return checked(rows.filter(r => r.model !== 'mteb/baseline-random-encoder'), 57);
  },
};
export default board;
