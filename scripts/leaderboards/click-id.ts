// CLICK-ID tests Indonesian clickbait headline classification.
// The headline is MTEB's test-set F1, shown as a percentage.
// This importer reads the public MTEB results feed.
import type { Leaderboard } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task = 'IndonesianIdClickbaitClassification';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/' + task + '/scores';
const board: Leaderboard = {
  benchmark: 'click-id', host: 'MTEB', url: 'https://leaderboard.mteb.org/tasks/' + task, feed,
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const rows = await taskScores(feed, task, 'f1', 190, 100);
    return checked(rows.filter(r => r.model !== 'mteb/baseline-random-encoder'), 190);
  },
};
export default board;
