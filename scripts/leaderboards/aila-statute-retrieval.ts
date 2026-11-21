// AILA Statute Retrieval ranks embedding models by nDCG at 10. The MTEB task API supplies the scores and model metadata.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/tasks/AILAStatutes/scores";

export const MTEB_MODEL_STATS = {
  activeParamsB: { name: 'Active parameters', unit: 'billions' },
  embeddingDim: { name: 'Embedding dimensions', unit: 'count' },
  maxTokens: { name: 'Maximum tokens', unit: 'tokens' },
  memoryUsageMb: { name: 'Memory usage', unit: 'count', note: 'Memory usage in megabytes.' },
} as const;

interface TaskRow {
  score: number;
  model: { name: string; url?: string; openWeights?: boolean; license?: string; totalParamsB?: number;
    activeParamsB?: number; embeddingDim?: number; maxTokens?: number; memoryUsageMb?: number };
}
export async function taskScores(feed: string, name: string, metric: string, minimum: number, scale = 1) {
  const data = await fetchJson<{ task: { name: string; mainScore: string }; rows: TaskRow[] }>(feed);
  if (data.task.name !== name || data.task.mainScore !== metric) throw new Error(`Unexpected task or metric for ${name}`);
  if (data.rows.length < minimum) throw new Error(`Expected at least ${minimum} scores for ${name}`);
  return data.rows.map(({ model, score }) => {
    if (!model.name || !Number.isFinite(score)) throw new Error(`Missing name or score in ${name}`);
    const metrics: Record<string, number> = {};
    for (const key of ['activeParamsB', 'embeddingDim', 'maxTokens', 'memoryUsageMb'] as const) {
      const value = model[key];
      if (typeof value === 'number' && value >= 0) metrics[key] = value;
    }
    return { model: model.name, score: score * scale, open: model.openWeights ?? undefined,
      params: model.totalParamsB != null && model.totalParamsB > 0 ? model.totalParamsB : undefined,
      license: model.license || undefined, link: model.url || undefined, metrics };
  });
}

const board: Leaderboard = {
  benchmark: "aila-statute-retrieval",
  url: "https://mteb-leaderboard.hf.space/tasks/AILAStatutes",
  feed: FEED,
  terms: "MTEB publishes its results dataset under CC0 1.0. https://huggingface.co/datasets/mteb/results The Space allows crawling in robots.txt.",
  stats: MTEB_MODEL_STATS,
  async fetch() {
    return taskScores(FEED, 'AILAStatutes', 'ndcg_at_10', 270);
  },
};
export default board;
