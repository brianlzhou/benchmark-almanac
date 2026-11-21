// IndicLID tests identification of Indian languages. The MTEB task API gives test accuracy
// for each embedding model as a fraction, which the importer converts to percent.
import type { Leaderboard } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task = 'IndicLangClassification';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/IndicLangClassification/scores';
const board: Leaderboard = {
  benchmark: 'indiclid-benchmark', url: 'https://leaderboard.mteb.org/tasks/' + task, feed, host: 'MTEB',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const rows = await taskScores(feed, task, 'accuracy', 196, 100);
    return checked(rows.filter(r => r.model !== 'mteb/baseline-random-encoder'), 195);
  },
};
export default board;
