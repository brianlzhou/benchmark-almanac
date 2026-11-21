// CIRR tests image retrieval from a reference photograph and a text modification.
// MTEB publishes test-set nDCG at 10 for its CIRR task. The importer converts the fraction to a percentage.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { taskScores } from './aila-statute-retrieval.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/CIRRIT2IRetrieval/scores';
const board: Leaderboard = {
  benchmark: 'cirr', url: 'https://mteb-leaderboard.hf.space/tasks/CIRRIT2IRetrieval', feed, host: 'MTEB',
  headline: 'MTEB reports test-set nDCG at 10, shown here as a percentage.',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  stats: {
    activeParamsB: { name: 'Active parameters', unit: 'billions' },
    embeddingDim: { name: 'Embedding dimensions', unit: 'count' },
    maxTokens: { name: 'Maximum tokens', unit: 'tokens' },
    memoryUsageMb: { name: 'Memory usage', unit: 'count', note: 'Memory usage in megabytes.' },
  },
  async fetch() {
    return checked(await taskScores(feed, 'CIRRIT2IRetrieval', 'ndcg_at_10', 52, 100), 52);
  },
};
export default board;
