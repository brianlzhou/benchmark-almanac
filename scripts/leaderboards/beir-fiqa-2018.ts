// BEIR FiQA-2018 ranks retrieval models by nDCG at 10 on investment questions.
// The MTEB task API supplies the scores, including the two reference baselines.
import type { Leaderboard } from './types.ts';
import { taskScores } from './aila-statute-retrieval.ts';

const feed = "https://mteb-leaderboard-backend.hf.space/v1/tasks/FiQA2018/scores";
const board: Leaderboard = {
  benchmark: 'beir-fiqa-2018',
  url: "https://leaderboard.mteb.org/tasks/FiQA2018",
  feed,
  terms: "Both hosts allow this path in robots.txt. MTEB publishes results under CC0 1.0. https://github.com/embeddings-benchmark/results/blob/main/LICENSE",
  async fetch() {
    return taskScores(feed, 'FiQA2018', 'ndcg_at_10', 295);
  },
};
export default board;
