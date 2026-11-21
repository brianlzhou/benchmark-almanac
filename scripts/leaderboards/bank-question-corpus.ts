// Bank Question Corpus ranks Chinese question embeddings by cosine Spearman correlation. MTEB's task API provides all 101 test scores and the validation scores when available.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/tasks/BQ/scores";

interface Row {
  model: { name: string; url?: string; openWeights?: boolean; license?: string; totalParamsB?: number };
  score: number | null;
  subsetScores: { default: Record<string, number> };
}

const board: Leaderboard = {
  benchmark: "bank-question-corpus",
  url: "https://mteb-leaderboard.hf.space/tasks/BQ",
  feed: FEED,
  terms: "MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results The MTEB Space allows crawling in robots.txt.",
  parts: { test: 'Test', validation: 'Validation' },
  async fetch() {
    const data = await fetchJson<{ task: { name: string; mainScore: string }; rows: Row[] }>(FEED);
    if (data.task.name !== 'BQ' || data.task.mainScore !== 'cosine_spearman' || data.rows.length < 101) throw new Error('Incomplete BQ rankings');
    return data.rows.map(({ model, subsetScores }) => {
      const metrics = subsetScores.default;
      const score = metrics.test;
      if (!model.name || !Number.isFinite(score) || !Object.keys(metrics).length || !Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid BQ result');
      return { model: model.name, score, metrics, open: model.openWeights ?? undefined, license: model.license || undefined,
        params: model.totalParamsB != null && model.totalParamsB > 0 ? model.totalParamsB : undefined, link: model.url || undefined };
    });
  },
};
export default board;
