// CEDR classifies Russian sentences into five emotions.
// The MTEB task feed reports multilabel accuracy for every embedding model on the test split.
import type { Leaderboard } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/CEDRClassification/scores';
const board: Leaderboard = {
  benchmark: 'corpus-for-emotion-detection-in-russian', host: 'MTEB',
  url: 'https://leaderboard.mteb.org/tasks/CEDRClassification', feed,
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  async fetch() {
    const rows = await taskScores(feed, 'CEDRClassification', 'accuracy', 2, 100);
    return checked(rows.map(row => ({ ...row, setting: 'MTEB CEDRClassification' })), rows.length);
  },
};
export default board;
