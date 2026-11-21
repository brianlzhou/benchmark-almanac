// DBpedia 14 tests topic classification on English Wikipedia text. The MTEB task feed
// reports accuracy as a fraction on the 2,048-example test split.
import type { Leaderboard } from './types.ts';
import { MTEB_MODEL_STATS, taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task = 'DBpediaClassification';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/DBpediaClassification/scores';
const board: Leaderboard = {
  benchmark: 'dbpedia-14', url: 'https://leaderboard.mteb.org/tasks/DBpediaClassification', feed, host: 'MTEB',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  stats: MTEB_MODEL_STATS,
  async fetch() {
    const all = await taskScores(feed, task, 'accuracy', 196, 100);
    const rows = all.filter(r => r.model !== 'mteb/baseline-random-encoder')
      .map(r => ({...r, trials: 2048, setting: 'MTEB DBpediaClassification'}));
    return checked(rows, 195);
  },
};
export default board;
