// Financial PhraseBank tests positive, negative and neutral sentiment in financial news.
// MTEB publishes classification accuracy as a fraction in its task scores feed.
import type { Leaderboard } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const task = 'FinancialPhrasebankClassification';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/' + task + '/scores';
const board: Leaderboard = {
  benchmark: 'financial-phrasebank',
  url: 'https://leaderboard.mteb.org/tasks/' + task,
  host: 'MTEB',
  feed,
  terms: 'MTEB publishes the results under CC0 1.0 at https://huggingface.co/datasets/mteb/results.',
  async fetch() {
    const rows = await taskScores(feed, task, 'accuracy', 194, 100);
    return checked(rows.filter(r => r.model !== 'mteb/baseline-random-encoder'), 193);
  },
};
export default board;
