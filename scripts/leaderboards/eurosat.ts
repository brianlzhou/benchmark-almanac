// EuroSAT tests land-cover classification from satellite images. The MTEB task feed
// reports test accuracy on the RGB release. Convert its fractions to percentages.
import type { Leaderboard } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/EuroSAT/scores';
const board: Leaderboard = {
  benchmark: 'eurosat', url: 'https://leaderboard.mteb.org/tasks/EuroSAT', feed, host: 'MTEB',
  terms: 'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',
  stats: { activeParamsB: { name: 'Active parameters', unit: 'billions' }, embeddingDim: { name: 'Embedding dimensions', unit: 'count' }, maxTokens: { name: 'Maximum tokens', unit: 'tokens' }, memoryUsageMb: { name: 'Memory usage', unit: 'count', note: 'Memory usage in megabytes.' } },
  async fetch() {
    const all = await taskScores(feed, 'EuroSAT', 'accuracy', 58, 100);
    const rows = all.filter(r => r.model !== 'mteb/baseline-random-encoder')
      .map(r => ({...r, trials:5400, setting:'MTEB RGB classification'}));
    return checked(rows, 58);
  },
};
export default board;
