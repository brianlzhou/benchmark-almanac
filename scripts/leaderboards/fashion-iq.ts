// Fashion IQ tests clothing image retrieval using a reference image and a comparative description.
// MTEB publishes test-set nDCG at 10 for its Fashion IQ task. Scores are shown as percentages.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { taskScores } from './aila-statute-retrieval.ts';

const task = 'FashionIQIT2IRetrieval';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/' + task + '/scores';
const board: Leaderboard = {
  benchmark:'fashion-iq', url:'https://leaderboard.mteb.org/tasks/' + task, feed, host:'MTEB',
  headline:'MTEB reports test-set nDCG at 10, shown as a percentage.',
  terms:'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  stats: { embeddingDim: { name: 'Embedding dimensions', unit: 'count' }, maxTokens: { name: 'Maximum tokens', unit: 'tokens' }, activeParamsB: { name: 'Active parameters', unit: 'billions' }, memoryUsageMb: { name: 'Memory usage', unit: 'count', note: 'Memory usage in megabytes.' } },
  async fetch() {
    const rows = await taskScores(feed, task, 'ndcg_at_10', 44, 100);
    return checked(rows.filter(r=>r.model !== 'mteb/baseline-random-encoder'),44);
  },
};
export default board;
