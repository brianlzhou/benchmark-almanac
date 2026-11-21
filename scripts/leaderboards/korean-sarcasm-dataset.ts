// The Korean Sarcasm Dataset tests binary sarcasm classification on Korean social text.
// The headline is MTEB's accuracy, converted from the API's 0 to 1 fraction to percent.
// This importer reads the current MTEB task scores API.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://huggingface.co/datasets/mteb/KorSarcasmClassification';
const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/KorSarcasmClassification/scores';

type Api = { rows: { model: { name: string }; score: number }[] };
const board: Leaderboard = {
  benchmark: 'korean-sarcasm-dataset',
  url,
  feed,
  terms: 'MTEB publishes this task score API under the CC0 license for its results repository. https://github.com/embeddings-benchmark/results/blob/main/LICENSE',
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<Api>(feed);
    const rows = data.rows.map((row) => ({ model: row.model.name, score: row.score * 100 }));
    if (rows.length < 2 || rows.some((row) => !Number.isFinite(row.score))) throw new Error('MTEB KorSarcasmClassification rows missing');
    return rows;
  },
};

export default board;
