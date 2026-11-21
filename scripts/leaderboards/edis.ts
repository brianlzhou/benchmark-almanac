// EDIS asks models to retrieve news images and titles from a text query. MTEB's
// EDIST2ITRetrieval feed gives test-set nDCG at 10 on a zero-to-one scale.
import type { Leaderboard } from './types.ts';
import { MTEB_MODEL_STATS, taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task = 'EDIST2ITRetrieval';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/EDIST2ITRetrieval/scores';
const board: Leaderboard = {
  benchmark: 'edis', url: 'https://leaderboard.mteb.org/tasks/EDIST2ITRetrieval', feed, host: 'MTEB',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  stats: MTEB_MODEL_STATS,
  async fetch() {
    const rows = await taskScores(feed, task, 'ndcg_at_10', 43);
    return checked(rows.filter(r => r.model !== 'mteb/baseline-random-encoder'), 43);
  },
};
export default board;
