// Norwegian Courts Bitext Mining aligns Bokmål and Nynorsk court sentences.
// The MTEB task feed reports bitext-mining F1 for each embedding model.
import type { Leaderboard } from './types.ts';
import { taskScores, MTEB_MODEL_STATS } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/NorwegianCourtsBitextMining/scores';
const board: Leaderboard = {
  benchmark: 'norwegian-courts-bitext-mining', host: 'MTEB',
  url: 'https://leaderboard.mteb.org/tasks/NorwegianCourtsBitextMining', feed,
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  stats: MTEB_MODEL_STATS,
  async fetch() {
    const rows = await taskScores(feed, 'NorwegianCourtsBitextMining', 'f1', 2, 100);
    return checked(rows.map(row => ({ ...row, setting: 'MTEB NorwegianCourtsBitextMining' })), rows.length);
  },
};
export default board;
