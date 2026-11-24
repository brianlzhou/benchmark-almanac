// HMDB51 tests recognition of 51 human actions in video clips.
// MTEB publishes classification accuracy on the test set of official split 1 as a fraction.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mteb-leaderboard-backend.hf.space/v1/tasks/HMDB51Classification/scores';
interface Result {
  model: { name: string, totalParamsB?: number, openWeights?: boolean, license?: string },
  score: number,
  subsetScores: { default: { test: number } },
}
const board: Leaderboard = {
  benchmark: 'hmdb51',
  host: 'MTEB',
  url: 'https://huggingface.co/spaces/mteb/leaderboard',
  feed,
  terms: 'MTEB publishes its results under CC0 1.0. https://github.com/embeddings-benchmark/results/blob/main/LICENSE',
  aliases: {
    'Qwen/Qwen3-VL-Embedding-8B': 'qwen3-vl-embedding-8b',
    'Qwen/Qwen3-VL-Embedding-2B': 'qwen3-vl-embedding-2b',
    'Qwen/Qwen2.5-Omni-7B': 'qwen2-5-omni-7b',
  },
  async fetch() {
    const data = await fetchJson<{ task: { name: string, mainScore: string }, rows: Result[] }>(feed);
    if (data.task.name !== 'HMDB51Classification' || data.task.mainScore !== 'accuracy')
      throw new Error('Missing HMDB51 classification accuracy');
    const rows = data.rows.map(({model, score, subsetScores}) => {
      if (!model.name || !Number.isFinite(score) || score < 0 || score > 1 || subsetScores.default.test !== score)
        throw new Error('Invalid HMDB51 test accuracy');
      return { model: model.name, score: score * 100, setting: 'Official split 1',
        params: model.totalParamsB ?? undefined, open: model.openWeights ?? undefined, license: model.license ?? undefined };
    });
    return checked(rows, Math.max(2, data.rows.length));
  },
};
export default board;
