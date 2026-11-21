// FarSick ranks Persian sentence similarity by Spearman correlation. Read the unscaled cosine Spearman values from MTEB's task API.
import type { Leaderboard } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/tasks/Farsick/scores";
const board: Leaderboard = {
  benchmark: "farsick",
  url: "https://mteb-leaderboard.hf.space/tasks/Farsick",
  feed: FEED,
  terms: "MTEB labels its results dataset CC0 1.0. https://huggingface.co/datasets/mteb/results The public Space allows leaderboard access.",
  stats: {
    activeParamsB: { name: 'Active parameters', unit: 'billions' },
    embeddingDim: { name: 'Embedding dimensions', unit: 'count' },
    maxTokens: { name: 'Maximum tokens', unit: 'tokens' },
    memoryUsageMb: { name: 'Memory usage in MB', better: 'lower' },
  },
  async fetch() {
    return taskScores(FEED, 'Farsick', 'cosine_spearman', 50);
  },
};
export default board;
