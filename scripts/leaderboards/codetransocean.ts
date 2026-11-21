// CodeTransOcean tests retrieval of code snippets from natural-language queries.
// The headline is MTEB test-set nDCG at 10 on CodeTransOcean-DL.
// This importer reads the public MTEB results feed.
import type { Leaderboard } from './types.ts';
import { MTEB_MODEL_STATS, taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task = 'CodeTransOceanDL';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/' + task + '/scores';
const board: Leaderboard = {
  benchmark: 'codetransocean', host: 'MTEB', url: 'https://leaderboard.mteb.org/tasks/' + task, feed,
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  stats: MTEB_MODEL_STATS,
  async fetch() {
    const rows = await taskScores(feed, task, 'ndcg_at_10', 209, 100);
    return checked(rows.filter(r => r.model !== 'mteb/baseline-random-encoder'), 208);
  },
};
export default board;
