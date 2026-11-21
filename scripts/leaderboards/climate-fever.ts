// CLIMATE-FEVER pairs climate claims with Wikipedia evidence. MTEB ranks retrieval models
// on the original evidence-retrieval task by normalized discounted cumulative gain at ten.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { taskScores } from './aila-statute-retrieval.ts';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/ClimateFEVER/scores';
const board: Leaderboard = {
  benchmark:'climate-fever', url:'https://leaderboard.mteb.org/tasks/ClimateFEVER', host:'MTEB', feed,
  headline:'MTEB ranks models by evidence retrieval nDCG@10 on a 0 to 1 scale.',
  terms:'MTEB publishes the results under CC0 1.0 at https://huggingface.co/datasets/mteb/results.',
  aliases:{'Qwen/Qwen3-Embedding-4B':'qwen3-embedding-4b','Qwen/Qwen3-Embedding-8B':'qwen3-embedding-8b','Qwen/Qwen3-Embedding-0.6B':'qwen3-embedding-0-6b'},
  async fetch() {
    const rows = await taskScores(feed,'ClimateFEVER','ndcg_at_10',248);
    // The catalog also contains a distinct Perplexity model named Sonar.
    for (const row of rows) if (row.model === 'facebook/SONAR') row.model += ' (Meta sentence embeddings)';
    return checked(rows,248);
  },
};
export default board;
